//! HTTP route handlers — zero-crate port of `backend/server.ts`.
//!
//! One function per route. Status codes, JSON error bodies, and cookie
//! attributes match the Node server so a parity harness can byte-diff them.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use crate::auth::{self, JwtError, JwtPayload, TOKEN_EXPIRATION_DAYS};
use crate::config;
use crate::crypto::{self, ct_eq};
use crate::db::{self, AuthRecord, Subscription, Usage, User, UserQuery};
use crate::http::{Cookie, Request, Response, SameSite};
use crate::json::{self, Json};
use crate::kdf;
use crate::middleware;
use crate::state::AppState;
use crate::stores::CSRF_TOKEN_EXPIRY_MS;
use crate::stripe;
use crate::stripe_worker::OwnedCheckoutParams;
use crate::validation;

/// Dispatch one request: CORS, security headers, routes, access log.
pub fn handle(state: &AppState, req: Request) -> Response {
    let start = config::now_ms();
    middleware::dev_request_log(&state.log, &req, state.prod);
    let res = if req.method.eq_ignore_ascii_case("OPTIONS") {
        middleware::preflight(&req, &state.cors_origins)
    } else {
        let inner = dispatch(state, &req);
        let inner = middleware::apply_secure_headers(inner, state.prod);
        middleware::apply_cors(inner, &req, &state.cors_origins)
    };
    middleware::access_log(&req.method, &req.path, res.status, config::now_ms() - start);
    res
}

fn dispatch(state: &AppState, req: &Request) -> Response {
    match (req.method.as_str(), req.path.as_str()) {
        ("POST", "/api/payment") => payment(state, req),
        ("GET", "/api/health") => health(state),
        ("GET", "/api/__integration_error_test__") if config::env("NODE_ENV").as_deref() == Some("test") => {
            unhandled(state, req, "Intentional integration test error")
        }
        ("POST", "/api/signup") => signup(state, req),
        ("POST", "/api/signin") => signin(state, req),
        ("POST", "/api/signout") => signout(state, req),
        ("GET", "/api/me") => me_get(state, req),
        ("PUT", "/api/me") => me_put(state, req),
        ("POST", "/api/usage") => usage(state, req),
        ("POST", "/api/checkout") => checkout(state, req),
        ("POST", "/api/portal") => portal(state, req),
        ("POST", "/api/xai/token") => xai_token(state, req),
        // Literals before `/api/courses/:slug` and `/api/bookmarks/:id`.
        ("GET", "/api/courses") => courses_list(state),
        ("GET", "/api/bookmarks") => bookmarks_list(state, req),
        ("DELETE", p) if p.starts_with("/api/bookmarks/") => bookmark_delete(state, req, p),
        ("GET", p) if p.starts_with("/api/progress/") => progress_get(state, req, p),
        (m, p) if p.starts_with("/api/courses/") => courses_dispatch(state, req, m, p),
        (m, p) if p.starts_with("/api/") => {
            if m == "GET" || m == "HEAD" {
                not_found()
            } else {
                not_found()
            }
        }
        ("GET" | "HEAD", _) => static_or_spa(state, req),
        _ => not_found(),
    }
}

/// Liveness plus a real database round-trip, so a container healthcheck fails when
/// SQLite is unreachable instead of reporting a process that cannot serve anything.
fn health(state: &AppState) -> Response {
    let (status, database) = match state.pool.ping() {
        Ok(()) => (200, "connected"),
        Err(e) => {
            state
                .log
                .error("Health check database probe failed", &[("error", json::s(e.to_string()))]);
            (503, "unavailable")
        }
    };
    json_res(
        status,
        &json::obj([
            ("status", json::s(if status == 200 { "ok" } else { "degraded" })),
            ("database", json::s(database)),
            ("timestamp", json::i(config::now_ms())),
        ]),
    )
}

fn not_found() -> Response {
    Response::text(404, "404 Not Found")
}

fn json_res(status: u16, v: &Json) -> Response {
    Response::json(status, &json::stringify(v))
}

fn err_json(status: u16, msg: &str) -> Response {
    json_res(status, &json::obj([("error", json::s(msg))]))
}

/// Map a Stripe worker / client error to an HTTP response.
///
/// Timeouts answer 504 so a slow Stripe cannot look like an application bug;
/// every other failure stays 500 with a generic body.
fn stripe_err(state: &AppState, log_msg: &str, e: crate::stripe::StripeError) -> Response {
    state
        .log
        .error(log_msg, &[("error", json::s(e.to_string()))]);
    match e {
        crate::stripe::StripeError::Timeout => err_json(504, "Payment provider timed out"),
        crate::stripe::StripeError::Busy => err_json(503, "Payment provider busy"),
        _ if log_msg.starts_with("Portal") => err_json(500, "Stripe portal failed"),
        _ if log_msg.starts_with("Checkout") => err_json(500, "Stripe session failed"),
        _ => err_json(500, "Stripe request failed"),
    }
}

fn unhandled(state: &AppState, req: &Request, message: &str) -> Response {
    let request_id = middleware::request_id();
    let mut meta: Vec<(&str, Json)> = vec![
        ("message", json::s(message)),
        ("path", json::s(req.path.clone())),
        ("method", json::s(req.method.clone())),
        ("requestId", json::s(request_id)),
    ];
    if !state.prod {
        meta.push(("stack", Json::Null));
    }
    state.log.error("Unhandled error occurred", &meta);
    if state.prod {
        err_json(500, "Internal server error")
    } else {
        json_res(500, &json::obj([("error", json::s(message))]))
    }
}

fn parse_json_body(req: &Request) -> Result<Json, Response> {
    json::parse(&req.body).map_err(|_| err_json(400, "Invalid request body"))
}

fn generate_csrf_token() -> Result<String, Response> {
    crypto::random_bytes(32)
        .map(|b| crypto::hex_encode(&b))
        .map_err(|_| err_json(500, "Server error"))
}

fn generate_uuid() -> Result<String, Response> {
    crypto::random_uuid_v4().map_err(|_| err_json(500, "Server error"))
}

fn generate_token(state: &AppState, user_id: &str) -> Result<String, Response> {
    let Some(secret) = state.jwt_secret.as_deref() else {
        state.log.error(
            "Token generation error",
            &[("error", json::s("JWT_SECRET not configured - authentication disabled"))],
        );
        return Err(err_json(500, "Server error"));
    };
    Ok(auth::jwt_sign(
        &JwtPayload {
            user_id: user_id.to_string(),
            exp: Some(auth::token_expire_timestamp(TOKEN_EXPIRATION_DAYS)),
        },
        secret,
    ))
}

fn require_auth(state: &AppState, req: &Request) -> Result<String, Response> {
    let Some(secret) = state.jwt_secret.as_deref() else {
        return Err(err_json(503, "Authentication service unavailable"));
    };
    let Some(token) = req.cookie("token") else {
        return Err(err_json(401, "Unauthorized"));
    };
    match auth::jwt_verify(&token, secret) {
        Ok(p) => Ok(p.user_id),
        Err(JwtError::Expired) => {
            state.log.debug("Token expired", &[]);
            Err(err_json(401, "Token expired"))
        }
        Err(e) => {
            state.log.error(
                "Token verification error",
                &[("error", json::s(format!("{e:?}")))],
            );
            Err(err_json(401, "Invalid token"))
        }
    }
}

/// CSRF check for a state-changing request.
///
/// A token that is missing, mismatched, unknown to the store, or expired is
/// refused with 403. The refusal carries a freshly minted token as a cookie
/// whenever the caller's identity is known, so a client whose token was lost —
/// the in-memory store does not survive a restart — can retry once and succeed.
///
/// Deliberately *not* done here: accepting the request and regenerating the
/// token on a store miss. That turns every post-restart request into a free
/// pass, because the stored token is what the header is checked against.
///
/// # Errors
/// A 403 [`Response`], ready to return, with a replacement cookie when one
/// could be issued.
fn require_csrf(state: &AppState, req: &Request, user_id: &str) -> Result<(), Response> {
    if req.method == "GET" || req.path == "/api/signup" || req.path == "/api/signin" {
        return Ok(());
    }
    let csrf_header = req.header("x-csrf-token");
    if csrf_header.is_none() || user_id.is_empty() {
        state.log.info(
            "CSRF validation failed - missing token or userID",
            &[
                ("hasToken", Json::Bool(csrf_header.is_some())),
                ("hasUserID", Json::Bool(!user_id.is_empty())),
                ("path", json::s(req.path.clone())),
            ],
        );
        return Err(err_json(403, "Invalid CSRF token"));
    }
    let csrf_header = csrf_header.unwrap_or("");
    let Some(stored) = state.csrf.get(user_id) else {
        state.log.info(
            "CSRF validation failed - no token on record for this user",
            &[
                ("userID", json::s(user_id)),
                ("path", json::s(req.path.clone())),
            ],
        );
        return Err(csrf_retry(state, user_id, "CSRF token expired"));
    };
    if csrf_header.len() != stored.token.len()
        || !ct_eq(csrf_header.as_bytes(), stored.token.as_bytes())
    {
        state.log.info(
            "CSRF validation failed - token mismatch",
            &[
                ("userID", json::s(user_id)),
                ("path", json::s(req.path.clone())),
            ],
        );
        return Err(err_json(403, "Invalid CSRF token"));
    }
    if config::now_ms() - stored.timestamp > CSRF_TOKEN_EXPIRY_MS {
        state.log.info(
            "CSRF validation failed - token expired",
            &[
                ("userID", json::s(user_id)),
                (
                    "age",
                    json::s(format!("{}s", (config::now_ms() - stored.timestamp) / 1000)),
                ),
            ],
        );
        return Err(csrf_retry(state, user_id, "CSRF token expired"));
    }
    state.log.debug("CSRF validation passed", &[("userID", json::s(user_id))]);
    Ok(())
}

/// Build a 403 that also hands the caller a usable token for one retry.
///
/// Falls back to a plain 403 when a token cannot be minted, so a failure of the
/// random source can never turn into an accepted request.
fn csrf_retry(state: &AppState, user_id: &str, message: &str) -> Response {
    match generate_csrf_token() {
        Ok(token) => {
            state.csrf.set(user_id, token.clone(), config::now_ms());
            err_json(403, message).cookie(&csrf_cookie(state, &token))
        }
        Err(_) => {
            state.csrf.remove(user_id);
            err_json(403, message)
        }
    }
}

fn token_cookie(state: &AppState, jwt: &str) -> Cookie {
    Cookie {
        name: "token".into(),
        value: jwt.to_string(),
        http_only: true,
        secure: state.prod,
        same_site: SameSite::Strict,
        path: "/".into(),
        max_age: Some(TOKEN_EXPIRATION_DAYS * 24 * 60 * 60),
    }
}

fn csrf_cookie(state: &AppState, token: &str) -> Cookie {
    Cookie {
        name: "csrf_token".into(),
        value: token.to_string(),
        http_only: false,
        secure: state.prod,
        same_site: SameSite::Lax,
        path: "/".into(),
        max_age: Some(CSRF_TOKEN_EXPIRY_MS / 1000),
    }
}

fn delete_token_cookie(state: &AppState) -> Cookie {
    let mut c = token_cookie(state, "");
    c.max_age = Some(0);
    c
}

fn delete_csrf_cookie(state: &AppState) -> Cookie {
    let mut c = csrf_cookie(state, "");
    c.max_age = Some(0);
    c
}

fn set_auth_cookies(state: &AppState, res: Response, user_id: &str, jwt: &str) -> Result<Response, Response> {
    let csrf = generate_csrf_token()?;
    state.csrf.set(user_id, csrf.clone(), config::now_ms());
    Ok(res.cookie(&token_cookie(state, jwt)).cookie(&csrf_cookie(state, &csrf)))
}

fn user_json(u: &User) -> Json {
    let mut m = BTreeMap::new();
    m.insert("_id".into(), Json::Str(u.id.clone()));
    m.insert("email".into(), Json::Str(u.email.clone()));
    m.insert("name".into(), Json::Str(u.name.clone()));
    m.insert("created_at".into(), json::i(u.created_at));
    if let Some(sub) = &u.subscription {
        let mut sm = BTreeMap::new();
        sm.insert("stripeID".into(), Json::Str(sub.stripe_id.clone()));
        sm.insert(
            "expires".into(),
            sub.expires.map(json::i).unwrap_or(Json::Null),
        );
        sm.insert("status".into(), Json::Str(sub.status.clone()));
        m.insert("subscription".into(), Json::Obj(sm));
    }
    if let Some(usage) = &u.usage {
        let mut um = BTreeMap::new();
        um.insert("count".into(), json::i(usage.count));
        um.insert(
            "reset_at".into(),
            usage.reset_at.map(json::i).unwrap_or(Json::Null),
        );
        m.insert("usage".into(), Json::Obj(um));
    }
    Json::Obj(m)
}

fn db_err(state: &AppState, context: &str, e: &db::DbError) -> Response {
    state
        .log
        .error(context, &[("error", json::s(e.to_string()))]);
    err_json(500, "Server error")
}

fn is_duplicate(e: &db::DbError) -> bool {
    e.message.contains("UNIQUE constraint failed") || e.message.contains("duplicate key")
}

fn signup(state: &AppState, req: &Request) -> Response {
    if let Err(res) = enforce_auth_rate_limit(state, req) {
        return res;
    }
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(mut email) = body.get_str("email").map(str::to_string) else {
        return err_json(400, "Invalid email format or length");
    };
    let Some(password) = body.get_str("password") else {
        return err_json(400, "Password must be 6-72 characters");
    };
    let Some(name) = body.get_str("name") else {
        return err_json(400, "Name required (max 100 characters)");
    };
    if !validation::validate_email(&email) {
        return err_json(400, "Invalid email format or length");
    }
    if !validation::validate_password(password) {
        return err_json(400, "Password must be 6-72 characters");
    }
    if !validation::validate_name(name) {
        return err_json(400, "Name required (max 100 characters)");
    }
    email = email.to_lowercase().trim().to_string();
    let name = validation::escape_html(name.trim());

    let hash = match kdf::hash_password(password) {
        Ok(h) => h,
        Err(e) => {
            state.log.error("Signup error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Server error");
        }
    };
    let insert_id = match generate_uuid() {
        Ok(id) => id,
        Err(r) => return r,
    };
    let user = User {
        id: insert_id.clone(),
        email: email.clone(),
        name: name.clone(),
        created_at: config::now_ms(),
        subscription: None,
        usage: None,
    };
    let auth_rec = AuthRecord {
        email: email.clone(),
        password: hash,
        user_id: insert_id.clone(),
    };
    // One transaction, so a failure cannot leave a user row with no credentials
    // — an account nobody can sign in to, holding an email address that can
    // never be registered again.
    if let Err(e) = state.pool.create_account(&user, &auth_rec) {
        if is_duplicate(&e) {
            state.log.warn("Signup failed - duplicate account", &[]);
            return err_json(400, "Unable to create account with provided credentials");
        }
        return db_err(state, "Signup error", &e);
    }
    let token = match generate_token(state, &insert_id) {
        Ok(t) => t,
        Err(r) => return r,
    };
    let body = json::obj([
        ("id", json::s(insert_id.clone())),
        ("email", json::s(email)),
        ("name", json::s(name.trim())),
        ("tokenExpires", json::i(auth::token_expire_timestamp(TOKEN_EXPIRATION_DAYS))),
    ]);
    match set_auth_cookies(state, json_res(201, &body), &insert_id, &token) {
        Ok(res) => {
            state.log.info("Signup success", &[]);
            res
        }
        Err(r) => r,
    }
}

fn signin(state: &AppState, req: &Request) -> Response {
    if let Err(res) = enforce_auth_rate_limit(state, req) {
        return res;
    }
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(mut email) = body.get_str("email").map(str::to_string) else {
        return err_json(400, "Invalid credentials");
    };
    let Some(password) = body.get_str("password") else {
        return err_json(400, "Invalid credentials");
    };
    if !validation::validate_email(&email) {
        return err_json(400, "Invalid credentials");
    }
    email = email.to_lowercase().trim().to_string();
    state.log.debug("Attempting signin", &[]);

    let ip = client_ip(req);
    let lock = state.lockout.is_locked(&email, &ip, config::now_ms());
    if lock.locked {
        let body = json::obj([
            ("error", json::s("Account temporarily locked. Try again later.")),
            ("retryAfter", json::i(lock.remaining_time)),
        ]);
        return json_res(429, &body).header("Retry-After", &lock.remaining_time.to_string());
    }

    let auth = match state.pool.find_auth(&email) {
        Ok(v) => v,
        Err(e) => return db_err(state, "Signin error", &e),
    };
    let Some(auth) = auth else {
        state.log.debug("Auth record not found", &[]);
        state.lockout.record_failure(&email, &ip, config::now_ms());
        return err_json(401, "Invalid credentials");
    };
    if !kdf::verify_password(password, &auth.password) {
        state.log.debug("Password verification failed", &[]);
        state.lockout.record_failure(&email, &ip, config::now_ms());
        return err_json(401, "Invalid credentials");
    }
    if kdf::needs_rehash(&auth.password) {
        match kdf::hash_password(password) {
            Ok(new_hash) => {
                if let Err(e) = state.pool.update_auth_password(&email, &new_hash) {
                    state
                        .log
                        .warn("Password rehash failed", &[("error", json::s(e.to_string()))]);
                } else {
                    state.log.debug("Password hash migrated to scrypt", &[]);
                }
            }
            Err(e) => state
                .log
                .warn("Password rehash failed", &[("error", json::s(e.to_string()))]),
        }
    }
    let user = match state.pool.find_user(&UserQuery::Email(email.clone())) {
        Ok(v) => v,
        Err(e) => return db_err(state, "Signin error", &e),
    };
    let Some(user) = user else {
        state.log.error("User not found for auth record", &[]);
        return err_json(401, "Invalid credentials");
    };
    state.lockout.clear(&email, &ip);
    let token = match generate_token(state, &user.id) {
        Ok(t) => t,
        Err(r) => return r,
    };
    let mut m = BTreeMap::new();
    m.insert("id".into(), Json::Str(user.id.clone()));
    m.insert("email".into(), Json::Str(user.email.clone()));
    m.insert("name".into(), Json::Str(user.name.clone()));
    if let Some(sub) = &user.subscription {
        let mut sm = BTreeMap::new();
        sm.insert("stripeID".into(), Json::Str(sub.stripe_id.clone()));
        sm.insert(
            "expires".into(),
            sub.expires.map(json::i).unwrap_or(Json::Null),
        );
        sm.insert("status".into(), Json::Str(sub.status.clone()));
        m.insert("subscription".into(), Json::Obj(sm));
    }
    m.insert(
        "tokenExpires".into(),
        json::i(auth::token_expire_timestamp(TOKEN_EXPIRATION_DAYS)),
    );
    match set_auth_cookies(state, json_res(200, &Json::Obj(m)), &user.id, &token) {
        Ok(res) => {
            state.log.info("Signin success", &[]);
            res
        }
        Err(r) => r,
    }
}

fn signout(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    // Sign-out changes server state, so it is CSRF-protected like any other
    // mutation. A refusal still hands back a usable token, so a client holding a
    // stale one can retry immediately rather than being stuck signed in.
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    state.csrf.remove(&user_id);
    state.log.info("Signout success", &[]);
    json_res(200, &json::obj([("message", json::s("Signed out successfully"))]))
        .cookie(&delete_token_cookie(state))
        .cookie(&delete_csrf_cookie(state))
}

fn me_get(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    state.log.debug("/me checking for user", &[]);
    match state.pool.find_user(&UserQuery::Id(user_id)) {
        Ok(Some(u)) => json_res(200, &user_json(&u)),
        Ok(None) => err_json(404, "User not found"),
        Err(e) => db_err(state, "Unhandled error occurred", &e),
    }
}

fn me_put(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    // A malformed body is the caller's mistake, so it answers 400 like every other
    // JSON route — not the 500 an earlier revision returned.
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    if let Some(name) = body.get("name") {
        let Some(name) = name.as_str() else {
            return err_json(400, "Name must be 1-100 characters");
        };
        if !validation::validate_name(name) {
            return err_json(400, "Name must be 1-100 characters");
        }
    }
    match state.pool.find_user(&UserQuery::Id(user_id.clone())) {
        Ok(Some(_)) => {}
        Ok(None) => return err_json(404, "User not found"),
        Err(e) => {
            state
                .log
                .error("Update user error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Failed to update user");
        }
    }
    let Some(name) = body.get_str("name") else {
        return err_json(400, "No valid fields to update");
    };
    let sanitized = validation::escape_html(name.trim());
    match state.pool.update_user_set_name(&user_id, &sanitized) {
        Ok(0) => err_json(400, "No changes made"),
        Ok(_) => match state.pool.find_user(&UserQuery::Id(user_id)) {
            Ok(Some(u)) => json_res(200, &user_json(&u)),
            Ok(None) => err_json(404, "User not found"),
            Err(e) => {
                state
                    .log
                    .error("Update user error", &[("error", json::s(e.to_string()))]);
                err_json(500, "Failed to update user")
            }
        },
        Err(e) => {
            state
                .log
                .error("Update user error", &[("error", json::s(e.to_string()))]);
            err_json(500, "Failed to update user")
        }
    }
}

fn resolve_usage(user: &User) -> Usage {
    user.usage.clone().unwrap_or(Usage {
        count: 0,
        reset_at: None,
    })
}

fn is_subscriber(sub: &Subscription) -> bool {
    sub.status == "active" && sub.expires.map(|e| e > config::now_secs()).unwrap_or(true)
}

fn sub_expires_iso(sub: &Subscription) -> Json {
    match sub.expires {
        Some(secs) => Json::Str(config::iso_from_secs(secs)),
        None => Json::Null,
    }
}

/// Length of a free-tier usage window, in seconds (30 days).
const USAGE_WINDOW_SECS: i64 = 30 * 24 * 60 * 60;

/// The 429 body returned when a free-tier caller has no quota left.
fn usage_limit_reached(limit: i64) -> Response {
    json_res(
        429,
        &json::obj([
            ("error", json::s("Usage limit reached")),
            ("remaining", json::i(0)),
            ("total", json::i(limit)),
            ("isSubscriber", Json::Bool(false)),
        ]),
    )
}

fn usage(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    // `operation: "track"` increments a stored counter, so this is a mutation.
    // The body is parsed as JSON regardless of Content-Type, which means a
    // cross-site form post could otherwise reach it without a preflight.
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let body = match json::parse(&req.body) {
        Ok(v) => v,
        Err(e) => {
            state
                .log
                .error("Usage tracking error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Server error");
        }
    };
    let operation = body.get_str("operation").unwrap_or("");
    if operation != "check" && operation != "track" {
        return err_json(400, "Invalid operation. Must be 'check' or 'track'");
    }
    let user = match state.pool.find_user(&UserQuery::Id(user_id.clone())) {
        Ok(Some(u)) => u,
        Ok(None) => return err_json(404, "User not found"),
        Err(e) => return db_err(state, "Usage tracking error", &e),
    };
    if let Some(sub) = &user.subscription {
        if is_subscriber(sub) {
            let mut sm = BTreeMap::new();
            sm.insert("status".into(), Json::Str(sub.status.clone()));
            sm.insert("expiresAt".into(), sub_expires_iso(sub));
            return json_res(
                200,
                &Json::Obj(BTreeMap::from([
                    ("remaining".into(), json::i(-1)),
                    ("total".into(), json::i(-1)),
                    ("isSubscriber".into(), Json::Bool(true)),
                    ("subscription".into(), Json::Obj(sm)),
                ])),
            );
        }
    }
    let limit = state.free_usage_limit;
    let now = config::now_secs();
    let mut usage = resolve_usage(&user);
    let is_tracking = operation == "track";
    // A limit below 1 admits nothing, including the first request of a new
    // window — which the window reset below would otherwise wave through.
    if is_tracking && limit < 1 {
        return usage_limit_reached(limit);
    }
    if usage.reset_at.map(|r| now > r).unwrap_or(true) {
        let new_reset = now + USAGE_WINDOW_SECS;
        // Reset and first increment together: a separate increment could be
        // issued by a concurrent request and then erased by this reset.
        match state
            .pool
            .reset_usage_window(&user_id, new_reset, is_tracking)
        {
            Ok(count) => {
                usage = Usage {
                    count,
                    reset_at: Some(new_reset),
                }
            }
            Err(e) => return db_err(state, "Usage tracking error", &e),
        }
    } else if is_tracking {
        // The limit is enforced inside the UPDATE, so concurrent requests
        // cannot both be admitted at the boundary.
        match state.pool.consume_usage(&user_id, limit) {
            Ok(Some(count)) => usage.count = count,
            Ok(None) => return usage_limit_reached(limit),
            Err(e) => return db_err(state, "Usage tracking error", &e),
        }
    }
    let remaining = (limit - usage.count).max(0);
    let mut m = BTreeMap::new();
    m.insert("remaining".into(), json::i(remaining));
    m.insert("total".into(), json::i(limit));
    m.insert("isSubscriber".into(), Json::Bool(false));
    m.insert("used".into(), json::i(usage.count));
    m.insert(
        "subscription".into(),
        match &user.subscription {
            Some(sub) => {
                let mut sm = BTreeMap::new();
                sm.insert("status".into(), Json::Str(sub.status.clone()));
                sm.insert("expiresAt".into(), sub_expires_iso(sub));
                Json::Obj(sm)
            }
            None => Json::Null,
        },
    );
    json_res(200, &Json::Obj(m))
}

fn checkout(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let Some(stripe) = state.stripe.as_ref() else {
        return err_json(503, "Stripe is not configured");
    };
    let body = match json::parse(&req.body) {
        Ok(v) => v,
        Err(e) => {
            state
                .log
                .error("Checkout session error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Stripe session failed");
        }
    };
    let (Some(email), Some(lookup_key)) = (body.get_str("email"), body.get_str("lookup_key")) else {
        return err_json(400, "Missing email or lookup_key");
    };
    if !state
        .stripe_lookup_keys
        .iter()
        .any(|allowed| allowed == lookup_key)
    {
        return err_json(400, "Unknown lookup_key");
    };
    let user = match state.pool.find_user(&UserQuery::Id(user_id)) {
        Ok(u) => u,
        Err(e) => {
            state
                .log
                .error("Checkout session error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Stripe session failed");
        }
    };
    if user.as_ref().map(|u| u.email.as_str()) != Some(email) {
        return err_json(403, "Email mismatch");
    }
    let price_id = match stripe.price_id_for_lookup_key(lookup_key) {
        Ok(Some(id)) => id,
        Ok(None) => {
            return err_json(400, &format!("No price found for lookup_key: {lookup_key}"))
        }
        Err(e) => return stripe_err(state, "Checkout session error", e),
    };
    let origin = state.redirect_origin(req.header("origin"));
    let app_name = AppState::app_name();
    let success = format!("{origin}/app/payment?success=true");
    let cancel = format!("{origin}/app/payment?canceled=true");
    match stripe.create_checkout_session(OwnedCheckoutParams {
        customer_email: email.to_string(),
        price_id,
        success_url: success,
        cancel_url: cancel,
        app_name,
        idempotency_key: None,
    }) {
        Ok(session) => json_res(
            200,
            &json::obj([
                ("url", session.url.map(json::s).unwrap_or(Json::Null)),
                ("id", json::s(session.id)),
                (
                    "customerID",
                    session.customer.map(json::s).unwrap_or(Json::Null),
                ),
            ]),
        ),
        Err(e) => stripe_err(state, "Checkout session error", e),
    }
}

fn portal(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let Some(stripe) = state.stripe.as_ref() else {
        return err_json(503, "Stripe is not configured");
    };
    let body = match json::parse(&req.body) {
        Ok(v) => v,
        Err(e) => {
            state
                .log
                .error("Portal session error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Stripe portal failed");
        }
    };
    let Some(customer_id) = body.get_str("customerID") else {
        return err_json(400, "Missing customerID");
    };
    let user = match state.pool.find_user(&UserQuery::Id(user_id)) {
        Ok(u) => u,
        Err(e) => {
            state
                .log
                .error("Portal session error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Stripe portal failed");
        }
    };
    // The caller may only manage the Stripe customer recorded against their own
    // account. Anything else — no user, no subscription, a blank stored id, or a
    // mismatch — is refused. Defaulting to "allow" when the account has no
    // subscription would let any signed-in user open a billing portal for an
    // arbitrary customer id and read or cancel someone else's subscription.
    let stored_id = user
        .as_ref()
        .and_then(|u| u.subscription.as_ref())
        .map(|s| s.stripe_id.as_str())
        .filter(|id| !id.is_empty());
    let authorized = stored_id
        .is_some_and(|id| ct_eq(id.as_bytes(), customer_id.as_bytes()));
    if !authorized {
        state.log.warn(
            "Portal denied - customerID does not match the caller's subscription",
            &[("path", json::s(req.path.clone()))],
        );
        return err_json(403, "Unauthorized customerID");
    }
    let origin = state.redirect_origin(req.header("origin"));
    let return_url = format!("{origin}/app/payment?portal=return");
    match stripe.create_portal_session(customer_id, &return_url) {
        Ok(session) => json_res(
            200,
            &json::obj([
                ("url", session.url.map(json::s).unwrap_or(Json::Null)),
                ("id", json::s(session.id)),
            ]),
        ),
        Err(e) => stripe_err(state, "Portal session error", e),
    }
}

fn period_end(obj: &Json) -> Option<i64> {
    obj.get_i64("current_period_end").or_else(|| {
        obj.get("items")
            .and_then(Json::as_obj)
            .and_then(|m| m.get("data"))
            .and_then(Json::as_arr)
            .and_then(|d| d.first())
            .and_then(|item| item.get_i64("current_period_end"))
    })
}

fn apply_sub_patch(state: &AppState, email: &str, sub: &Subscription) -> bool {
    match state.pool.find_user(&UserQuery::Email(email.to_string())) {
        Ok(Some(u)) => match state.pool.update_user_subscription(&u.id, sub) {
            Ok(_) => true,
            Err(e) => {
                state
                    .log
                    .error("Webhook processing error", &[("error", json::s(e.to_string()))]);
                false
            }
        },
        Ok(None) => {
            state
                .log
                .warn("Webhook: No user found for email", &[("email", json::s(redact_email(email)))]);
            false
        }
        Err(e) => {
            state
                .log
                .error("Webhook processing error", &[("error", json::s(e.to_string()))]);
            false
        }
    }
}

/// Mask an email address for logging.
///
/// Webhook logs are verbose, shipped off-host, and retained far longer than the
/// request that produced them, so writing full addresses turns the log into a
/// copy of the customer list. Keeping the first character and the domain leaves
/// enough to match a support report against a log line without storing the
/// address itself. Anything without an `@` is dropped entirely rather than
/// guessed at.
fn redact_email(email: &str) -> String {
    let Some((local, domain)) = email.split_once('@') else {
        return "[redacted]".to_string();
    };
    match local.chars().next() {
        Some(first) => format!("{first}***@{domain}"),
        None => format!("***@{domain}"),
    }
}

fn build_sub_patch(stripe_id: &str, stripe_sub: &Json) -> Subscription {
    Subscription {
        stripe_id: stripe_id.to_string(),
        expires: period_end(stripe_sub),
        status: stripe_sub.get_str("status").unwrap_or("").to_string(),
    }
}

fn payment(state: &AppState, req: &Request) -> Response {
    state.log.info("Payment webhook received", &[]);
    if state.stripe.is_none() {
        return err_json(503, "Stripe is not configured");
    }
    let Some(signature) = req.header("stripe-signature") else {
        return err_json(400, "Missing signature");
    };
    let Some(secret) = state.stripe_endpoint_secret.as_deref() else {
        return err_json(503, "Stripe is not configured");
    };
    let event = match stripe::construct_event(
        &req.body,
        signature,
        secret,
        stripe::DEFAULT_WEBHOOK_TOLERANCE_SECS,
    ) {
        Ok(v) => v,
        Err(e) => {
            state.log.error(
                "Webhook signature verification failed",
                &[("error", json::s(e.to_string()))],
            );
            return Response::empty(400);
        }
    };
    state.log.debug(
        "Webhook event received",
        &[("type", json::s(event.get_str("type").unwrap_or("").to_string()))],
    );
    let Some(event_id) = event.get_str("id").map(str::to_string) else {
        return Response::empty(400);
    };
    let event_type = event.get_str("type").unwrap_or("").to_string();
    match state.pool.find_webhook_event(&event_id) {
        Ok(Some(_)) => {
            state.log.info(
                "Webhook event already processed, skipping",
                &[("eventId", json::s(event_id))],
            );
            return Response::empty(200);
        }
        Ok(None) => {}
        Err(e) => {
            state
                .log
                .error("Webhook processing error", &[("error", json::s(e.to_string()))]);
            return Response::empty(500);
        }
    }
    let obj = event
        .get("data")
        .and_then(|d| d.get("object"))
        .cloned()
        .unwrap_or(json::obj([]));
    if let Err(e) = process_webhook(state, &event_id, &event_type, &obj) {
        return e;
    }
    // Recorded only after the effect has been applied, so the record can never
    // claim an event was handled when it was not. Recording first and deleting
    // on failure only covers a returned error: a crash, timeout, or kill
    // between the insert and the update would leave the event marked as
    // processed forever, and the retry Stripe sends would be skipped.
    //
    // This ordering trades that for the possibility of applying an event twice,
    // which is safe here because every write these handlers perform sets
    // subscription columns to absolute values read from Stripe rather than
    // mutating them relative to what is already stored.
    if let Err(e) = state
        .pool
        .insert_webhook_event(&event_id, &event_type, config::now_ms())
    {
        // The effect is already applied. Asking Stripe to retry would only
        // repeat idempotent work, so acknowledge and keep the error visible.
        state.log.error(
            "Applied webhook event but failed to record it - a retry would be reprocessed",
            &[
                ("eventId", json::s(event_id)),
                ("error", json::s(e.to_string())),
            ],
        );
    }
    Response::empty(200)
}

fn process_webhook(
    state: &AppState,
    event_id: &str,
    event_type: &str,
    obj: &Json,
) -> Result<(), Response> {
    let stripe = state.stripe.as_ref();
    if matches!(
        event_type,
        "customer.subscription.deleted"
            | "customer.subscription.updated"
            | "customer.subscription.created"
    ) {
        let Some(stripe_id) = obj.get_str("customer") else {
            state
                .log
                .error("Webhook missing customer ID", &[("type", json::s(event_type))]);
            return Err(Response::empty(400));
        };
        let email = match resolve_customer_email(state, stripe_id) {
            Ok(Some(e)) => e,
            Ok(None) => return Err(Response::empty(400)),
            Err(_) => return Err(Response::empty(400)),
        };
        if period_end(obj).is_none() {
            state.log.error(
                "Webhook: subscription event has no current_period_end",
                &[
                    ("type", json::s(event_type)),
                    ("eventId", json::s(event_id)),
                ],
            );
        }
        let sub = Subscription {
            stripe_id: stripe_id.to_string(),
            expires: period_end(obj),
            status: obj.get_str("status").unwrap_or("").to_string(),
        };
        if apply_sub_patch(state, &email, &sub) {
            state.log.info(
                "Subscription updated",
                &[
                    ("type", json::s(event_type)),
                    ("email", json::s(redact_email(&email))),
                    ("status", json::s(sub.status)),
                ],
            );
        }
    }
    if event_type == "checkout.session.completed" {
        let stripe_id = obj.get_str("customer");
        let subscription_id = obj.get_str("subscription");
        if let (Some(stripe), Some(stripe_id), Some(subscription_id)) =
            (stripe, stripe_id, subscription_id)
        {
            let sub_json = match stripe.retrieve_subscription(subscription_id) {
                Ok(v) => v,
                Err(e) => {
                    state
                        .log
                        .error("Webhook processing error", &[("error", json::s(e.to_string()))]);
                    return Err(Response::empty(500));
                }
            };
            let email = if let Some(e) = obj.get_str("customer_email") {
                e.to_lowercase()
            } else {
                match resolve_customer_email(state, stripe_id) {
                    Ok(Some(e)) => e,
                    Ok(None) => return Ok(()),
                    Err(_) => return Err(Response::empty(500)),
                }
            };
            let patch = build_sub_patch(stripe_id, &sub_json);
            if apply_sub_patch(state, &email, &patch) {
                state.log.info(
                    "Checkout completed",
                    &[
                        ("email", json::s(redact_email(&email))),
                        ("status", json::s(patch.status)),
                    ],
                );
            }
        }
    }
    if event_type == "invoice.paid" {
        let stripe_id = obj.get_str("customer");
        let subscription_id = obj.get_str("subscription").or_else(|| {
            obj.get("parent")
                .and_then(|p| p.get("subscription_details"))
                .and_then(|d| d.get_str("subscription"))
        });
        if let (Some(stripe), Some(stripe_id), Some(subscription_id)) =
            (stripe, stripe_id, subscription_id)
        {
            let sub_json = match stripe.retrieve_subscription(subscription_id) {
                Ok(v) => v,
                Err(e) => {
                    state
                        .log
                        .error("Webhook processing error", &[("error", json::s(e.to_string()))]);
                    return Err(Response::empty(500));
                }
            };
            let email = match resolve_customer_email(state, stripe_id) {
                Ok(Some(e)) => e,
                Ok(None) => return Ok(()),
                Err(_) => return Err(Response::empty(500)),
            };
            let patch = build_sub_patch(stripe_id, &sub_json);
            if apply_sub_patch(state, &email, &patch) {
                state.log.info("Invoice paid", &[("email", json::s(redact_email(&email)))]);
            }
        }
    }
    if event_type == "invoice.payment_failed" {
        if let Some(stripe_id) = obj.get_str("customer") {
            if let Ok(Some(email)) = resolve_customer_email(state, stripe_id) {
                // yagni: SQLite has no paymentFailed columns; Node's dotted $set
                // is a no-op on this adapter. Log the same as Node when a user
                // exists. Add columns if billing UX needs the flag.
                match state.pool.find_user(&UserQuery::Email(email.clone())) {
                    Ok(Some(_)) => {
                        state
                            .log
                            .warn("Invoice payment failed", &[("email", json::s(redact_email(&email)))]);
                    }
                    Ok(None) => {
                        state.log.warn(
                            "Webhook: No user found for email",
                            &[("email", json::s(redact_email(&email)))],
                        );
                    }
                    Err(e) => {
                        state.log.error(
                            "Webhook processing error",
                            &[("error", json::s(e.to_string()))],
                        );
                        return Err(Response::empty(500));
                    }
                }
            }
        }
    }
    Ok(())
}

fn resolve_customer_email(state: &AppState, stripe_id: &str) -> Result<Option<String>, ()> {
    let Some(stripe) = state.stripe.as_ref() else {
        state
            .log
            .warn("Webhook: Stripe not configured", &[("stripeID", json::s(stripe_id))]);
        return Ok(None);
    };
    match stripe.customer_email(stripe_id) {
        Ok(Some(e)) => Ok(Some(e)),
        Ok(None) => {
            state
                .log
                .warn("Webhook: Customer has no email", &[("stripeID", json::s(stripe_id))]);
            Ok(None)
        }
        Err(e) => {
            state
                .log
                .error("Webhook processing error", &[("error", json::s(e.to_string()))]);
            Err(())
        }
    }
}

fn has_extension(path: &str) -> bool {
    path.rsplit('/')
        .next()
        .and_then(|s| s.rsplit_once('.'))
        .map(|(_, ext)| !ext.is_empty() && ext.chars().all(|c| c.is_ascii_alphanumeric() || c == '_'))
        .unwrap_or(false)
}

fn static_or_spa(state: &AppState, req: &Request) -> Response {
    if let Some(res) = crate::http::serve_file(&state.static_dir, &req.path) {
        return res;
    }
    if req.path.starts_with("/api/") || has_extension(&req.path) {
        return not_found();
    }
    spa_fallback(state)
}

/// Production-only cache of `index.html`, which never changes while the process runs.
static INDEX_HTML: std::sync::OnceLock<Option<String>> = std::sync::OnceLock::new();

/// Serve the SPA shell for any non-API path.
///
/// In production the file is read once and kept in memory — every client-side route
/// lands here, so re-reading it per request is pure syscall overhead. Development
/// reads from disk each time so a rebuild shows up without restarting the server.
fn spa_fallback(state: &AppState) -> Response {
    let read_index = || {
        std::fs::read(state.static_dir.join("index.html"))
            .ok()
            .map(|bytes| String::from_utf8_lossy(&bytes).into_owned())
    };
    let html = if state.prod {
        INDEX_HTML.get_or_init(read_index).clone()
    } else {
        read_index()
    };
    match html {
        Some(body) => Response::html(200, &body),
        None => Response::text(200, "Welcome to Skateboard API"),
    }
}

/// Drop expired CSRF tokens. Called from the hourly cleanup thread.
pub fn run_csrf_cleanup(state: &AppState) {
    let cleaned = state.csrf.cleanup(config::now_ms());
    if cleaned > 0 {
        state.log.debug(
            "CSRF cleanup completed",
            &[("removedTokens", json::i(cleaned as i64))],
        );
    }
}

/// Days a processed Stripe webhook id is remembered for replay protection.
/// Stripe stops retrying an event after ~3 days, so 30 is generous.
const WEBHOOK_RETENTION_DAYS: i64 = 30;

/// Drop webhook records past [`WEBHOOK_RETENTION_DAYS`]. Called from the hourly thread.
pub fn run_webhook_cleanup(state: &AppState) {
    let cutoff = config::now_ms() - WEBHOOK_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    match state.pool.prune_webhook_events(cutoff) {
        Ok(removed) if removed > 0 => state
            .log
            .debug("Webhook cleanup completed", &[("removedEvents", json::i(removed))]),
        Ok(_) => {}
        Err(e) => state
            .log
            .error("Webhook cleanup failed", &[("error", json::s(e.to_string()))]),
    }
}

/// Drop expired lockout and auth-rate entries. Called from the 15-minute cleanup thread.
pub fn run_lockout_cleanup(state: &AppState) {
    let now = config::now_ms();
    let cleaned = state.lockout.cleanup(now);
    if cleaned > 0 {
        state.log.debug(
            "Lockout cleanup completed",
            &[("removedEntries", json::i(cleaned as i64))],
        );
    }
    let rate_cleaned = state.auth_rate.cleanup(now);
    if rate_cleaned > 0 {
        state.log.debug(
            "Auth rate-limit cleanup completed",
            &[("removedEntries", json::i(rate_cleaned as i64))],
        );
    }
}

/// Client IP used for auth rate limiting and lockout keys.
///
/// Transport `peer_ip` by default. `TRUST_PROXY` is the number of reverse
/// proxies in front of this process (`TRUST_PROXY=1` for a single proxy such as
/// Railway); set it only when every one of those hops is trusted.
///
/// Proxies **append** to `X-Forwarded-For`, so the leftmost entry is whatever
/// the client sent and must never be trusted — rotating it would mint a fresh
/// rate-limit and lockout bucket per request. Index `hops` from the right
/// instead: with one trusted proxy that is the address it observed.
///
/// Falls back to `peer_ip` when the header is absent or carries fewer entries
/// than `hops` (a spoofed-short chain then shares the proxy's bucket rather
/// than escaping into one of its own).
fn client_ip(req: &Request) -> String {
    let hops = config::env("TRUST_PROXY")
        .and_then(|v| v.trim().parse::<usize>().ok())
        .unwrap_or(0);
    if hops > 0 {
        if let Some(xff) = req.header("x-forwarded-for") {
            let chain: Vec<&str> = xff
                .split(',')
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect();
            if let Some(ip) = chain.len().checked_sub(hops).and_then(|i| chain.get(i)) {
                return (*ip).to_string();
            }
        }
    }
    req.peer_ip.clone()
}

/// Refuse the request when this IP has exhausted the auth sliding window.
fn enforce_auth_rate_limit(state: &AppState, req: &Request) -> Result<(), Response> {
    let ip = client_ip(req);
    let status = state.auth_rate.check_and_record(&ip, config::now_ms());
    if !status.limited {
        return Ok(());
    }
    let body = json::obj([
        ("error", json::s("Too many authentication attempts. Try again later.")),
        ("retryAfter", json::i(status.retry_after_secs)),
    ]);
    Err(json_res(429, &body).header("Retry-After", &status.retry_after_secs.to_string()))
}

// ==== APPSCHOOL ROUTES ====

fn db_fail(state: &AppState, log_msg: &str, e: db::DbError) -> Response {
    state
        .log
        .error(log_msg, &[("error", json::s(e.to_string()))]);
    err_json(500, "Internal server error")
}

fn t(v: impl Into<String>) -> db::Value {
    db::Value::Text(v.into())
}

fn value_json(v: &db::Value) -> Json {
    match v {
        db::Value::Null => Json::Null,
        db::Value::Int(n) => json::i(*n),
        db::Value::Real(n) => json::n(*n),
        db::Value::Text(s) => json::s(s.clone()),
    }
}

fn row_map(row: &db::Row) -> BTreeMap<String, Json> {
    let mut m = BTreeMap::new();
    for (k, v) in row.iter() {
        m.insert(k.to_string(), value_json(v));
    }
    m
}

fn as_bool_flag(v: Option<&Json>) -> bool {
    match v {
        Some(Json::Bool(b)) => *b,
        Some(Json::Num(n)) => *n != 0.0,
        Some(Json::Str(s)) => s != "0" && !s.is_empty(),
        _ => false,
    }
}

fn parse_json_field(raw: Option<&Json>, fallback: Json) -> Json {
    match raw {
        Some(Json::Str(s)) if !s.is_empty() => json::parse(s.as_bytes()).unwrap_or(fallback),
        Some(Json::Null) | None => fallback,
        Some(other) => other.clone(),
    }
}

fn published_and_order(m: &mut BTreeMap<String, Json>) {
    let flag = as_bool_flag(m.get("published"));
    m.insert("published".into(), Json::Bool(flag));
    if let Some(v) = m.get("order_index").cloned() {
        m.insert("order".into(), v);
    }
}

fn course_json(row: &db::Row) -> Json {
    let mut m = row_map(row);
    let tags = parse_json_field(m.get("tags"), Json::Arr(Vec::new()));
    m.insert("tags".into(), tags);
    published_and_order(&mut m);
    Json::Obj(m)
}

fn guide_json(row: &db::Row) -> Json {
    let mut m = row_map(row);
    published_and_order(&mut m);
    let slug = m.get("slug").and_then(Json::as_str).unwrap_or("").to_string();
    let empty = match m.get("content") {
        Some(Json::Str(s)) if !s.is_empty() => false,
        Some(Json::Null) | None => true,
        _ => false,
    };
    if empty {
        if let Some(body) = load_named_file(&content_dir("new-guides"), &slug) {
            m.insert("content".into(), json::s(body));
        }
    }
    Json::Obj(m)
}

fn quiz_row_json(row: &db::Row) -> Json {
    let mut m = row_map(row);
    let questions = parse_json_field(m.get("questions"), Json::Arr(Vec::new()));
    m.insert("questions".into(), questions);
    published_and_order(&mut m);
    Json::Obj(m)
}

fn rep_json(row: &db::Row, include_solution: bool) -> Json {
    let mut m = row_map(row);
    let key_points = parse_json_field(m.get("keyPoints"), Json::Arr(Vec::new()));
    let hints = parse_json_field(m.get("hints"), Json::Arr(Vec::new()));
    m.insert("keyPoints".into(), key_points);
    m.insert("hints".into(), hints);
    published_and_order(&mut m);
    if !include_solution {
        m.remove("solution");
    } else {
        let slug = m.get("slug").and_then(Json::as_str).unwrap_or("").to_string();
        let empty = match m.get("solution") {
            Some(Json::Str(s)) if !s.is_empty() => false,
            Some(Json::Null) | None => true,
            _ => false,
        };
        if empty {
            if let Some(body) = load_named_file(&content_dir("new-reps"), &slug) {
                m.insert("solution".into(), json::s(body));
            }
        }
    }
    Json::Obj(m)
}

fn bookmark_json(row: &db::Row) -> Json {
    Json::Obj(row_map(row))
}

fn content_dir(name: &str) -> PathBuf {
    config::backend_dir().join(name)
}

fn safe_slug(slug: &str) -> bool {
    !slug.is_empty()
        && !slug.contains("..")
        && slug
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

fn load_named_file(dir: &Path, slug: &str) -> Option<String> {
    if !safe_slug(slug) {
        return None;
    }
    for ext in ["md", "swift", "js", "ts", "txt"] {
        let p = dir.join(format!("{slug}.{ext}"));
        if let Ok(s) = std::fs::read_to_string(&p) {
            return Some(s);
        }
    }
    walk_match(dir, slug, 0)
}

fn walk_match(dir: &Path, slug: &str, depth: usize) -> Option<String> {
    if depth > 4 {
        return None;
    }
    let entries = std::fs::read_dir(dir).ok()?;
    for ent in entries.flatten() {
        let path = ent.path();
        if path.is_dir() {
            if let Some(s) = walk_match(&path, slug, depth + 1) {
                return Some(s);
            }
            continue;
        }
        let name = ent.file_name();
        let name = name.to_string_lossy();
        let stem = name.rsplit_once('.').map(|(s, _)| s).unwrap_or(&name);
        let stripped = stem.trim_start_matches(|c: char| c.is_ascii_digit() || c == '-');
        if stem == slug || stripped == slug || stem.ends_with(&format!("-{slug}")) {
            return std::fs::read_to_string(path).ok();
        }
    }
    None
}

fn iso_now() -> String {
    iso_from_ms(config::now_ms())
}

fn iso_from_ms(ms: i64) -> String {
    let secs = ms.div_euclid(1000);
    let millis = ms.rem_euclid(1000) as u32;
    let days = secs.div_euclid(86_400);
    let rem = secs.rem_euclid(86_400) as u32;
    let hh = rem / 3600;
    let mm = (rem % 3600) / 60;
    let ss = rem % 60;
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = y + i64::from(month <= 2);
    format!("{year:04}-{month:02}-{d:02}T{hh:02}:{mm:02}:{ss:02}.{millis:03}Z")
}

fn query_one(state: &AppState, sql: &str, params: &[db::Value]) -> Result<Option<db::Row>, Response> {
    match state.pool.with(|d| d.query(sql, params)) {
        Ok(rows) => Ok(rows.into_iter().next()),
        Err(e) => Err(db_fail(state, "query failed", e)),
    }
}

fn query_all(state: &AppState, sql: &str, params: &[db::Value]) -> Result<Vec<db::Row>, Response> {
    match state.pool.with(|d| d.query(sql, params)) {
        Ok(rows) => Ok(rows),
        Err(e) => Err(db_fail(state, "query failed", e)),
    }
}

fn run_sql(state: &AppState, sql: &str, params: &[db::Value]) -> Result<db::Changes, Response> {
    match state.pool.with(|d| d.run(sql, params)) {
        Ok(c) => Ok(c),
        Err(e) => Err(db_fail(state, "write failed", e)),
    }
}

fn find_course(state: &AppState, slug: &str) -> Result<db::Row, Response> {
    match query_one(
        state,
        "SELECT * FROM Courses WHERE slug = ? AND published = 1",
        &[t(slug)],
    )? {
        Some(row) => Ok(row),
        None => Err(err_json(404, "Course not found")),
    }
}

fn course_id(row: &db::Row) -> Result<String, Response> {
    row.text("_id")
        .map(str::to_string)
        .ok_or_else(|| err_json(500, "Internal server error"))
}

fn courses_dispatch(state: &AppState, req: &Request, method: &str, path: &str) -> Response {
    let rest = path.strip_prefix("/api/courses/").unwrap_or("");
    let segs: Vec<&str> = rest.split('/').filter(|s| !s.is_empty()).collect();
    match (method, segs.as_slice()) {
        ("GET", [slug]) => course_get(state, slug),
        ("GET", [slug, "guides"]) => guides_list(state, slug),
        ("GET", [slug, "guides", guide_slug]) => guide_get(state, slug, guide_slug),
        ("GET", [slug, "guides", guide_slug, "bookmarks"]) => {
            guide_bookmarks_get(state, req, slug, guide_slug)
        }
        ("POST", [slug, "guides", guide_slug, "bookmarks"]) => {
            guide_bookmarks_post(state, req, slug, guide_slug)
        }
        ("DELETE", [slug, "guides", guide_slug, "bookmarks"]) => {
            guide_bookmarks_delete(state, req, slug, guide_slug)
        }
        ("POST", [slug, "guides", guide_slug, "complete"]) => {
            guide_complete(state, req, slug, guide_slug)
        }
        ("GET", [slug, "quizzes", guide_slug]) => quiz_attempt(state, slug, guide_slug),
        ("POST", [slug, "quizzes", guide_slug, "submit"]) => {
            quiz_submit(state, req, slug, guide_slug)
        }
        ("GET", [slug, "reps"]) => reps_list(state, slug),
        ("GET", [slug, "reps", rep_slug]) => rep_practice(state, slug, rep_slug),
        ("GET", [slug, "reps", rep_slug, "solution"]) => rep_solution(state, slug, rep_slug),
        ("POST", [slug, "reps", rep_slug, "complete"]) => {
            rep_complete(state, req, slug, rep_slug)
        }
        ("POST", [slug, "enroll"]) => course_enroll(state, req, slug),
        _ => not_found(),
    }
}

fn courses_list(state: &AppState) -> Response {
    match query_all(
        state,
        "SELECT * FROM Courses WHERE published = 1 ORDER BY order_index ASC",
        &[],
    ) {
        Ok(rows) => json_res(200, &Json::Arr(rows.iter().map(course_json).collect())),
        Err(r) => r,
    }
}

fn course_get(state: &AppState, slug: &str) -> Response {
    match find_course(state, slug) {
        Ok(row) => json_res(200, &course_json(&row)),
        Err(r) => r,
    }
}

fn guides_list(state: &AppState, slug: &str) -> Response {
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match query_all(
        state,
        "SELECT * FROM Guides WHERE courseId = ? AND published = 1 ORDER BY order_index ASC",
        &[t(id)],
    ) {
        Ok(rows) => json_res(
            200,
            &Json::Arr(rows.iter().map(guide_json).collect()),
        ),
        Err(r) => r,
    }
}

fn guide_get(state: &AppState, slug: &str, guide_slug: &str) -> Response {
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match query_one(
        state,
        "SELECT * FROM Guides WHERE courseId = ? AND slug = ? AND published = 1",
        &[t(id), t(guide_slug)],
    ) {
        Ok(Some(row)) => json_res(200, &guide_json(&row)),
        Ok(None) => err_json(404, "Guide not found"),
        Err(r) => r,
    }
}

fn shuffle_json(arr: &mut [Json]) {
    if arr.len() < 2 {
        return;
    }
    for i in (1..arr.len()).rev() {
        let j = match crate::crypto::random_bytes(8) {
            Ok(b) => {
                let mut n = 0u64;
                for x in b {
                    n = (n << 8) | u64::from(x);
                }
                (n as usize) % (i + 1)
            }
            Err(_) => 0,
        };
        arr.swap(i, j);
    }
}

fn option_id(opt: &Json) -> String {
    match opt {
        Json::Str(s) => s.clone(),
        other => other.get_str("id").unwrap_or("").to_string(),
    }
}

fn option_text(opt: &Json, fallback: &str) -> String {
    match opt {
        Json::Str(s) => s.clone(),
        other => other
            .get_str("text")
            .or_else(|| other.get_str("label"))
            .unwrap_or(fallback)
            .to_string(),
    }
}

fn get_option_text(question: &Json, answer: &Json) -> Json {
    let Some(id) = answer.as_str() else {
        return answer.clone();
    };
    if id.is_empty() {
        return answer.clone();
    }
    let empty: &[Json] = &[];
    let options = question.get("options").and_then(Json::as_arr).unwrap_or(empty);
    let mut sorted: Vec<&Json> = options.iter().collect();
    sorted.sort_by(|a, b| option_id(a).cmp(&option_id(b)));
    if id.len() == 1 && id.chars().all(|c| c.is_ascii_alphabetic()) {
        let idx = (id.to_ascii_lowercase().as_bytes()[0] - b'a') as usize;
        if let Some(opt) = sorted.get(idx) {
            return json::s(option_text(opt, id));
        }
    }
    if let Some(opt) = options.iter().find(|o| o.get_str("id") == Some(id)) {
        return json::s(option_text(opt, id));
    }
    json::s(id)
}

fn quiz_for_attempt(row: &db::Row) -> Json {
    let full = quiz_row_json(row);
    let mut questions = full
        .get("questions")
        .and_then(Json::as_arr)
        .unwrap_or(&[])
        .to_vec();
    for q in &mut questions {
        let mut options = q
            .get("options")
            .and_then(Json::as_arr)
            .unwrap_or(&[])
            .to_vec();
        shuffle_json(&mut options);
        let mut m = BTreeMap::new();
        if let Some(id) = q.get("id").cloned() {
            m.insert("id".into(), id);
        }
        if let Some(question) = q.get("question").cloned() {
            m.insert("question".into(), question);
        }
        if let Some(typ) = q.get("type").cloned() {
            m.insert("type".into(), typ);
        }
        m.insert("options".into(), Json::Arr(options));
        if let Some(points) = q.get("points").cloned() {
            m.insert("points".into(), points);
        }
        *q = Json::Obj(m);
    }
    json::obj([
        ("_id", full.get("_id").cloned().unwrap_or(Json::Null)),
        ("slug", full.get("slug").cloned().unwrap_or(Json::Null)),
        ("title", full.get("title").cloned().unwrap_or(Json::Null)),
        (
            "description",
            full.get("description").cloned().unwrap_or(Json::Null),
        ),
        (
            "passingScore",
            full.get("passingScore").cloned().unwrap_or(json::i(70)),
        ),
        (
            "totalPoints",
            full.get("totalPoints").cloned().unwrap_or(json::i(0)),
        ),
        ("questions", Json::Arr(questions)),
    ])
}

fn quiz_attempt(state: &AppState, slug: &str, guide_slug: &str) -> Response {
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match query_one(
        state,
        "SELECT * FROM Quizzes WHERE courseId = ? AND slug = ? AND published = 1",
        &[t(id), t(guide_slug)],
    ) {
        Ok(Some(row)) => json_res(200, &quiz_for_attempt(&row)),
        Ok(None) => err_json(404, "Quiz not found"),
        Err(r) => r,
    }
}

fn grade_quiz(quiz: &Json, answers: &BTreeMap<String, Json>) -> Json {
    let questions = quiz
        .get("questions")
        .and_then(Json::as_arr)
        .unwrap_or(&[]);
    let mut earned = 0i64;
    let mut computed_total = 0i64;
    let mut results = Vec::new();
    let mut correct_count = 0i64;
    for q in questions {
        let qid = q.get("id").and_then(Json::as_str).unwrap_or("");
        let user_answer = answers.get(qid).cloned().unwrap_or(Json::Null);
        let correct_answer = q.get("correctAnswer").cloned().unwrap_or(Json::Null);
        let points = q.get_i64("points").unwrap_or(1);
        computed_total += points;
        let is_correct = json::stringify(&user_answer) == json::stringify(&correct_answer);
        if is_correct {
            earned += points;
            correct_count += 1;
        }
        results.push(json::obj([
            ("questionId", json::s(qid)),
            ("correct", Json::Bool(is_correct)),
            ("userAnswer", get_option_text(q, &user_answer)),
            ("correctAnswer", get_option_text(q, &correct_answer)),
            (
                "explanation",
                q.get("explanation").cloned().unwrap_or(Json::Null),
            ),
            ("points", json::i(if is_correct { points } else { 0 })),
        ]));
    }
    let score = if computed_total == 0 {
        0
    } else {
        ((earned as f64) / (computed_total as f64) * 100.0).round() as i64
    };
    let passing = quiz.get_i64("passingScore").unwrap_or(70);
    json::obj([
        ("quizId", quiz.get("_id").cloned().unwrap_or(Json::Null)),
        ("score", json::i(score)),
        ("passed", Json::Bool(score >= passing)),
        ("earnedPoints", json::i(earned)),
        (
            "totalPoints",
            quiz.get("totalPoints").cloned().unwrap_or(json::i(0)),
        ),
        ("correctCount", json::i(correct_count)),
        ("totalQuestions", json::i(questions.len() as i64)),
        ("results", Json::Arr(results)),
    ])
}

fn quiz_submit(state: &AppState, req: &Request, slug: &str, guide_slug: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let course_id_s = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    let quiz_row = match query_one(
        state,
        "SELECT * FROM Quizzes WHERE courseId = ? AND slug = ? AND published = 1",
        &[t(&course_id_s), t(guide_slug)],
    ) {
        Ok(Some(row)) => row,
        Ok(None) => return err_json(404, "Quiz not found"),
        Err(r) => return r,
    };
    let quiz = quiz_row_json(&quiz_row);
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let mut answers_map = BTreeMap::new();
    let mut answers_arr = Vec::new();
    if let Some(arr) = body.get("answers").and_then(Json::as_arr) {
        for a in arr {
            let qid = a.get_str("questionId").unwrap_or("").to_string();
            let ans = a.get("answer").cloned().unwrap_or(Json::Null);
            answers_arr.push(a.clone());
            answers_map.insert(qid, ans);
        }
    }
    let result = grade_quiz(&quiz, &answers_map);
    let quiz_id = quiz.get_str("_id").unwrap_or("").to_string();
    let score = result.get_i64("score").unwrap_or(0);
    let passed = result.get("passed").and_then(Json::as_bool).unwrap_or(false);
    let time_spent = body.get_i64("timeSpentSeconds").unwrap_or(0);
    if let Err(r) = add_quiz_attempt(
        state,
        &user_id,
        &course_id_s,
        &quiz_id,
        score,
        passed,
        &Json::Arr(answers_arr),
        time_spent,
    ) {
        return r;
    }
    json_res(200, &result)
}

fn get_or_create_progress(
    state: &AppState,
    user_id: &str,
    course_id: &str,
) -> Result<Json, Response> {
    if let Some(row) = query_one(
        state,
        "SELECT * FROM UserProgress WHERE userId = ? AND courseId = ?",
        &[t(user_id), t(course_id)],
    )? {
        return Ok(progress_row_json(&row));
    }
    let now = iso_now();
    let id = generate_uuid()?;
    run_sql(
        state,
        "INSERT INTO UserProgress
           (_id, userId, courseId, completedGuides, quizAttempts, repAttempts,
            totalTimeSpentMinutes, lastActivityAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        &[
            t(&id),
            t(user_id),
            t(course_id),
            t("[]"),
            t("[]"),
            t("[]"),
            db::Value::Int(0),
            t(&now),
            t(&now),
            t(&now),
        ],
    )?;
    Ok(json::obj([
        ("_id", json::s(id)),
        ("userId", json::s(user_id)),
        ("courseId", json::s(course_id)),
        ("completedGuides", Json::Arr(Vec::new())),
        ("quizAttempts", Json::Arr(Vec::new())),
        ("repAttempts", Json::Arr(Vec::new())),
        ("totalTimeSpentMinutes", json::i(0)),
        ("lastActivityAt", json::s(now.clone())),
        ("createdAt", json::s(now.clone())),
        ("updatedAt", json::s(now)),
    ]))
}

fn progress_row_json(row: &db::Row) -> Json {
    let mut m = row_map(row);
    m.insert(
        "completedGuides".into(),
        parse_json_field(m.get("completedGuides"), Json::Arr(Vec::new())),
    );
    m.insert(
        "quizAttempts".into(),
        parse_json_field(m.get("quizAttempts"), Json::Arr(Vec::new())),
    );
    m.insert(
        "repAttempts".into(),
        parse_json_field(m.get("repAttempts"), Json::Arr(Vec::new())),
    );
    Json::Obj(m)
}

fn add_quiz_attempt(
    state: &AppState,
    user_id: &str,
    course_id: &str,
    quiz_id: &str,
    score: i64,
    passed: bool,
    answers: &Json,
    time_spent: i64,
) -> Result<(), Response> {
    let progress = get_or_create_progress(state, user_id, course_id)?;
    let now = iso_now();
    let attempt = json::obj([
        ("quizId", json::s(quiz_id)),
        ("score", json::i(score)),
        ("passed", Json::Bool(passed)),
        ("answers", answers.clone()),
        ("timeSpentSeconds", json::i(time_spent)),
        ("attemptedAt", json::s(&now)),
    ]);
    let mut attempts = progress
        .get("quizAttempts")
        .and_then(Json::as_arr)
        .unwrap_or(&[])
        .to_vec();
    attempts.push(attempt);
    run_sql(
        state,
        "UPDATE UserProgress SET quizAttempts = ?, lastActivityAt = ?, updatedAt = ?
         WHERE userId = ? AND courseId = ?",
        &[
            t(json::stringify(&Json::Arr(attempts))),
            t(&now),
            t(&now),
            t(user_id),
            t(course_id),
        ],
    )?;
    Ok(())
}

fn reps_list(state: &AppState, slug: &str) -> Response {
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match query_all(
        state,
        "SELECT * FROM Reps WHERE courseId = ? AND published = 1 ORDER BY category ASC, order_index ASC",
        &[t(id)],
    ) {
        Ok(rows) => json_res(
            200,
            &Json::Arr(rows.iter().map(|r| rep_json(r, false)).collect()),
        ),
        Err(r) => r,
    }
}

fn find_rep(state: &AppState, course_id: &str, rep_slug: &str) -> Result<db::Row, Response> {
    match query_one(
        state,
        "SELECT * FROM Reps WHERE courseId = ? AND slug = ? AND published = 1",
        &[t(course_id), t(rep_slug)],
    )? {
        Some(row) => Ok(row),
        None => Err(err_json(404, "Rep not found")),
    }
}

fn rep_practice(state: &AppState, slug: &str, rep_slug: &str) -> Response {
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    let row = match find_rep(state, &id, rep_slug) {
        Ok(r) => r,
        Err(r) => return r,
    };
    let full = rep_json(&row, false);
    json_res(
        200,
        &json::obj([
            ("_id", full.get("_id").cloned().unwrap_or(Json::Null)),
            ("slug", full.get("slug").cloned().unwrap_or(Json::Null)),
            ("title", full.get("title").cloned().unwrap_or(Json::Null)),
            (
                "category",
                full.get("category").cloned().unwrap_or(Json::Null),
            ),
            (
                "priority",
                full.get("priority").cloned().unwrap_or(Json::Null),
            ),
            ("prompt", full.get("prompt").cloned().unwrap_or(Json::Null)),
            (
                "targetMinutes",
                full.get("targetMinutes").cloned().unwrap_or(Json::Null),
            ),
            (
                "starterCode",
                full.get("starterCode").cloned().unwrap_or(Json::Null),
            ),
            ("hints", full.get("hints").cloned().unwrap_or(Json::Arr(Vec::new()))),
        ]),
    )
}

fn rep_solution(state: &AppState, slug: &str, rep_slug: &str) -> Response {
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match find_rep(state, &id, rep_slug) {
        Ok(row) => json_res(200, &rep_json(&row, true)),
        Err(r) => r,
    }
}

fn course_enroll(state: &AppState, req: &Request, slug: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let course_id_s = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Some(existing) = match query_one(
        state,
        "SELECT * FROM Enrollments WHERE userId = ? AND courseId = ?",
        &[t(&user_id), t(&course_id_s)],
    ) {
        Ok(v) => v,
        Err(r) => return r,
    } {
        if existing.text("status") == Some("active") {
            return json_res(200, &Json::Obj(row_map(&existing)));
        }
        let now = iso_now();
        let eid = existing.text("_id").unwrap_or("").to_string();
        if let Err(r) = run_sql(
            state,
            "UPDATE Enrollments SET status = ?, updatedAt = ? WHERE _id = ? AND userId = ?",
            &[t("active"), t(&now), t(&eid), t(&user_id)],
        ) {
            return r;
        }
        let mut m = row_map(&existing);
        m.insert("status".into(), json::s("active"));
        return json_res(200, &Json::Obj(m));
    }
    let now = iso_now();
    let id = match generate_uuid() {
        Ok(v) => v,
        Err(r) => return r,
    };
    if let Err(r) = run_sql(
        state,
        "INSERT INTO Enrollments
           (_id, userId, courseId, status, enrolledAt, completedAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        &[
            t(&id),
            t(&user_id),
            t(&course_id_s),
            t("active"),
            t(&now),
            db::Value::Null,
            db::Value::Null,
        ],
    ) {
        return r;
    }
    json_res(
        200,
        &json::obj([
            ("_id", json::s(id)),
            ("userId", json::s(user_id)),
            ("courseId", json::s(course_id_s)),
            ("status", json::s("active")),
            ("enrolledAt", json::s(now)),
            ("completedAt", Json::Null),
            ("updatedAt", Json::Null),
        ]),
    )
}

fn guide_complete(state: &AppState, req: &Request, slug: &str, guide_slug: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let course_id_s = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    let guide = match query_one(
        state,
        "SELECT * FROM Guides WHERE courseId = ? AND slug = ? AND published = 1",
        &[t(&course_id_s), t(guide_slug)],
    ) {
        Ok(Some(row)) => row,
        Ok(None) => return err_json(404, "Guide not found"),
        Err(r) => return r,
    };
    let guide_id = match guide.text("_id") {
        Some(id) => id.to_string(),
        None => return err_json(500, "Internal server error"),
    };
    let progress = match get_or_create_progress(state, &user_id, &course_id_s) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let already = progress
        .get("completedGuides")
        .and_then(Json::as_arr)
        .unwrap_or(&[])
        .iter()
        .any(|g| g.get_str("guideId") == Some(guide_id.as_str()));
    if !already {
        let now = iso_now();
        let mut completed = progress
            .get("completedGuides")
            .and_then(Json::as_arr)
            .unwrap_or(&[])
            .to_vec();
        completed.push(json::obj([
            ("guideId", json::s(&guide_id)),
            ("completedAt", json::s(&now)),
        ]));
        if let Err(r) = run_sql(
            state,
            "UPDATE UserProgress SET completedGuides = ?, lastActivityAt = ?, updatedAt = ?
             WHERE userId = ? AND courseId = ?",
            &[
                t(json::stringify(&Json::Arr(completed))),
                t(&now),
                t(&now),
                t(&user_id),
                t(&course_id_s),
            ],
        ) {
            return r;
        }
    }
    json_res(200, &json::obj([("success", Json::Bool(true))]))
}

fn rep_complete(state: &AppState, req: &Request, slug: &str, rep_slug: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let course_id_s = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    let row = match find_rep(state, &course_id_s, rep_slug) {
        Ok(r) => r,
        Err(r) => return r,
    };
    let rep_id = match row.text("_id") {
        Some(id) => id.to_string(),
        None => return err_json(500, "Internal server error"),
    };
    let target = row.int("targetMinutes").unwrap_or(0);
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let actual = body.get_i64("actualMinutes").unwrap_or(0);
    let code_match = body.get("codeMatch").and_then(Json::as_bool).unwrap_or(false);
    let progress = match get_or_create_progress(state, &user_id, &course_id_s) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let now = iso_now();
    let attempt = json::obj([
        ("repId", json::s(&rep_id)),
        ("completedAt", json::s(&now)),
        ("actualMinutes", json::i(actual)),
        ("targetMinutes", json::i(target)),
        ("underTarget", Json::Bool(actual <= target)),
        ("codeMatch", Json::Bool(code_match)),
    ]);
    let mut attempts = progress
        .get("repAttempts")
        .and_then(Json::as_arr)
        .unwrap_or(&[])
        .to_vec();
    attempts.push(attempt);
    let total = progress.get_i64("totalTimeSpentMinutes").unwrap_or(0) + actual;
    if let Err(r) = run_sql(
        state,
        "UPDATE UserProgress SET
           repAttempts = ?, totalTimeSpentMinutes = ?, lastActivityAt = ?, updatedAt = ?
         WHERE userId = ? AND courseId = ?",
        &[
            t(json::stringify(&Json::Arr(attempts))),
            db::Value::Int(total),
            t(&now),
            t(&now),
            t(&user_id),
            t(&course_id_s),
        ],
    ) {
        return r;
    }
    json_res(200, &json::obj([("success", Json::Bool(true))]))
}

fn detailed_progress(progress: &Json) -> Json {
    let completed_guides = progress
        .get("completedGuides")
        .and_then(Json::as_arr)
        .unwrap_or(&[]);
    let quiz_attempts = progress
        .get("quizAttempts")
        .and_then(Json::as_arr)
        .unwrap_or(&[]);
    let mut passed: Vec<Json> = Vec::new();
    for a in quiz_attempts {
        if a.get("passed").and_then(Json::as_bool) == Some(true) {
            if let Some(id) = a.get("quizId").cloned() {
                if !passed.iter().any(|p| json::stringify(p) == json::stringify(&id)) {
                    passed.push(id);
                }
            }
        }
    }
    let mut completed_rep_ids: Vec<Json> = Vec::new();
    let rep_attempts = progress
        .get("repAttempts")
        .cloned()
        .or_else(|| progress.get("completedReps").cloned())
        .unwrap_or(Json::Arr(Vec::new()));
    let rep_arr = rep_attempts.as_arr().unwrap_or(&[]);
    for a in rep_arr {
        if let Some(id) = a.get("repId").cloned() {
            if !completed_rep_ids
                .iter()
                .any(|p| json::stringify(p) == json::stringify(&id))
            {
                completed_rep_ids.push(id);
            }
        }
    }
    json::obj([
        (
            "completedGuideIds",
            Json::Arr(
                completed_guides
                    .iter()
                    .filter_map(|g| g.get("guideId").cloned())
                    .collect(),
            ),
        ),
        ("completedGuides", Json::Arr(completed_guides.to_vec())),
        ("passedQuizIds", Json::Arr(passed)),
        ("completedRepIds", Json::Arr(completed_rep_ids)),
        ("quizAttempts", Json::Arr(quiz_attempts.to_vec())),
        ("repAttempts", Json::Arr(rep_arr.to_vec())),
        (
            "totalTimeSpentMinutes",
            progress
                .get("totalTimeSpentMinutes")
                .cloned()
                .unwrap_or(json::i(0)),
        ),
        (
            "lastActivityAt",
            progress.get("lastActivityAt").cloned().unwrap_or(Json::Null),
        ),
    ])
}

fn empty_progress() -> Json {
    json::obj([
        ("completedGuideIds", Json::Arr(Vec::new())),
        ("completedGuides", Json::Arr(Vec::new())),
        ("passedQuizIds", Json::Arr(Vec::new())),
        ("completedRepIds", Json::Arr(Vec::new())),
        ("quizAttempts", Json::Arr(Vec::new())),
        ("repAttempts", Json::Arr(Vec::new())),
        ("totalTimeSpentMinutes", json::i(0)),
        ("lastActivityAt", Json::Null),
    ])
}

fn progress_get(state: &AppState, req: &Request, path: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    let slug = path.strip_prefix("/api/progress/").unwrap_or("");
    let course = match find_course(state, slug) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let course_id_s = match course_id(&course) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match query_one(
        state,
        "SELECT * FROM UserProgress WHERE userId = ? AND courseId = ?",
        &[t(&user_id), t(&course_id_s)],
    ) {
        Ok(Some(row)) => json_res(200, &detailed_progress(&progress_row_json(&row))),
        Ok(None) => json_res(200, &empty_progress()),
        Err(r) => r,
    }
}

fn bookmarks_list(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match query_all(
        state,
        "SELECT * FROM Bookmarks WHERE userId = ? ORDER BY bookmarkedAt DESC",
        &[t(&user_id)],
    ) {
        Ok(rows) => json_res(200, &Json::Arr(rows.iter().map(bookmark_json).collect())),
        Err(r) => r,
    }
}

fn bookmark_delete(state: &AppState, req: &Request, path: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let bookmark_id = path.strip_prefix("/api/bookmarks/").unwrap_or("");
    match run_sql(
        state,
        "DELETE FROM Bookmarks WHERE _id = ? AND userId = ?",
        &[t(bookmark_id), t(&user_id)],
    ) {
        Ok(c) => json_res(200, &json::obj([("deletedCount", json::i(c.changes))])),
        Err(r) => r,
    }
}

fn guide_bookmarks_get(state: &AppState, req: &Request, slug: &str, guide_slug: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    match query_all(
        state,
        "SELECT * FROM Bookmarks WHERE userId = ? AND courseSlug = ? AND guideSlug = ?",
        &[t(&user_id), t(slug), t(guide_slug)],
    ) {
        Ok(rows) => {
            let titles: Vec<Json> = rows
                .iter()
                .filter_map(|r| r.text("sectionTitle").map(json::s))
                .collect();
            json_res(200, &json::obj([("bookmarkedSections", Json::Arr(titles))]))
        }
        Err(r) => r,
    }
}

fn guide_bookmarks_post(state: &AppState, req: &Request, slug: &str, guide_slug: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let section = body.get_str("sectionTitle").unwrap_or("").to_string();
    let id = match generate_uuid() {
        Ok(v) => v,
        Err(r) => return r,
    };
    let now = iso_now();
    if let Err(r) = run_sql(
        state,
        "INSERT INTO Bookmarks
           (_id, userId, courseSlug, guideSlug, sectionTitle, bookmarkedAt)
         VALUES (?, ?, ?, ?, ?, ?)",
        &[
            t(&id),
            t(&user_id),
            t(slug),
            t(guide_slug),
            t(&section),
            t(&now),
        ],
    ) {
        return r;
    }
    json_res(
        200,
        &json::obj([
            ("_id", json::s(id)),
            ("userId", json::s(user_id)),
            ("courseSlug", json::s(slug)),
            ("guideSlug", json::s(guide_slug)),
            ("sectionTitle", json::s(section)),
            ("bookmarkedAt", json::s(now)),
        ]),
    )
}

fn guide_bookmarks_delete(state: &AppState, req: &Request, slug: &str, guide_slug: &str) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let section = body.get_str("sectionTitle").unwrap_or("");
    match run_sql(
        state,
        "DELETE FROM Bookmarks
          WHERE userId = ? AND courseSlug = ? AND guideSlug = ? AND sectionTitle = ?",
        &[t(&user_id), t(slug), t(guide_slug), t(section)],
    ) {
        Ok(c) => json_res(200, &json::obj([("deletedCount", json::i(c.changes))])),
        Err(r) => r,
    }
}

fn xai_token(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let Some(api_key) = config::env_nonempty("XAI_API_KEY") else {
        return err_json(503, "Voice is not configured (missing XAI_API_KEY).");
    };
    let auth = format!("Bearer {api_key}");
    let payload = r#"{"expires_after":{"seconds":300}}"#;
    match crate::httpc::post_json(
        "https://api.x.ai/v1/realtime/client_secrets",
        &[("Authorization", auth.as_str())],
        payload,
        15_000,
    ) {
        Ok(resp) if resp.ok() => {
            let parsed = json::parse(resp.body.as_slice()).ok();
            let value = parsed
                .as_ref()
                .and_then(|v| v.get_str("value"))
                .map(str::to_string);
            let Some(token) = value else {
                return err_json(502, "Invalid token response from xAI.");
            };
            let expires_at = match parsed.as_ref().and_then(|v| v.get_i64("expires_at")) {
                Some(secs) => iso_from_ms(secs.saturating_mul(1000)),
                None => iso_from_ms(config::now_ms().saturating_add(300_000)),
            };
            json_res(
                200,
                &json::obj([
                    ("token", json::s(token)),
                    ("expires_at", json::s(expires_at)),
                    ("model", json::s("grok-voice-latest")),
                ]),
            )
        }
        Ok(resp) => {
            state.log.error(
                "xAI client_secrets failed",
                &[("status", json::i(i64::from(resp.status)))],
            );
            err_json(502, "Failed to mint voice token.")
        }
        Err(e) => {
            state
                .log
                .error("xAI client_secrets failed", &[("error", json::s(e.to_string()))]);
            err_json(502, "Failed to mint voice token.")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Logger;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Mutex;

    static TEST_DIR_SEQ: AtomicU64 = AtomicU64::new(0);

    /// Tests mutate process env; serialize them so they cannot clobber each other.
    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn test_state() -> (AppState, std::path::PathBuf) {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        test_state_locked()
    }

    /// Like [`test_state`] but assumes the caller already holds [`ENV_LOCK`].
    fn test_state_locked() -> (AppState, std::path::PathBuf) {
        let n = TEST_DIR_SEQ.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!("sk-rs-{}-{n}", std::process::id()));
        std::fs::create_dir_all(dir.join("databases")).unwrap();
        std::fs::write(
            dir.join("config.json"),
            r#"{"staticDir":"dist","database":{"db":"T","dbType":"sqlite","connectionString":"./databases/T.db"}}"#,
        )
        .unwrap();
        // SAFETY: serialized by ENV_LOCK; tests run with a dedicated dir.
        unsafe {
            std::env::set_var("JWT_SECRET", "test-secret-value-at-least-32-chars!!");
            std::env::remove_var("STRIPE_KEY");
            std::env::remove_var("STRIPE_ENDPOINT_SECRET");
            std::env::remove_var("PORT");
            std::env::remove_var("NODE_ENV");
        }
        let state = AppState::open_in(&dir, 2, Logger::new(true)).expect("open");
        (state, dir)
    }

    fn json_body(res: &Response) -> Json {
        json::parse(&res.body).expect("json")
    }

    fn cookie_header(req: &mut Request, res: &Response) {
        let cookies: Vec<String> = res
            .headers
            .iter()
            .filter(|(k, _)| k.eq_ignore_ascii_case("Set-Cookie"))
            .map(|(_, v)| v.split(';').next().unwrap_or(v).to_string())
            .collect();
        if !cookies.is_empty() {
            req.set_test_header("cookie", &cookies.join("; "));
        }
        if let Some((_, csrf)) = res.headers.iter().find(|(k, v)| {
            k.eq_ignore_ascii_case("Set-Cookie") && v.starts_with("csrf_token=")
        }) {
            let token = csrf.split('=').nth(1).unwrap_or("").split(';').next().unwrap_or("");
            req.set_test_header("x-csrf-token", token);
        }
    }

    /// Replay the cookies set by `sources`, in order, with later responses
    /// overriding earlier ones by cookie name — so an auth cookie from signup
    /// can be combined with a replacement CSRF cookie from a later response.
    ///
    /// `send_csrf` controls whether the matching `x-csrf-token` header is sent,
    /// which is what separates "client has no token" from "token is stale".
    fn replay_cookies(req: &mut Request, sources: &[&Response], send_csrf: bool) {
        let mut jar: Vec<(String, String)> = Vec::new();
        for res in sources {
            let set_cookies = res
                .headers
                .iter()
                .filter(|(k, _)| k.eq_ignore_ascii_case("Set-Cookie"));
            for (_, value) in set_cookies {
                let pair = value.split(';').next().unwrap_or(value);
                let Some((name, token)) = pair.split_once('=') else {
                    continue;
                };
                jar.retain(|(existing, _)| existing != name);
                jar.push((name.to_string(), token.to_string()));
            }
        }
        if !jar.is_empty() {
            let serialized: Vec<String> =
                jar.iter().map(|(n, v)| format!("{n}={v}")).collect();
            req.set_test_header("cookie", &serialized.join("; "));
        }
        if send_csrf {
            if let Some((_, token)) = jar.iter().find(|(name, _)| name == "csrf_token") {
                req.set_test_header("x-csrf-token", token);
            }
        }
    }

    #[test]
    fn health_ok() {
        let (state, dir) = test_state();
        let res = handle(&state, Request::for_test("GET", "/api/health"));
        assert_eq!(res.status, 200);
        let body = json_body(&res);
        assert_eq!(body.get_str("status"), Some("ok"));
        assert!(body.get_i64("timestamp").is_some());
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn signup_rejects_bad_email() {
        let (state, dir) = test_state();
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(br#"{"email":"nope","password":"secret1","name":"Ada"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 400);
        assert_eq!(json_body(&res).get_str("error"), Some("Invalid email format or length"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn signup_signin_me_round_trip() {
        let (state, dir) = test_state();
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(br#"{"email":"Ada@Example.COM","password":"secret1","name":"Ada"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 201, "{}", String::from_utf8_lossy(&res.body));
        let body = json_body(&res);
        assert_eq!(body.get_str("email"), Some("ada@example.com"));
        assert_eq!(body.get_str("name"), Some("Ada"));

        let mut me = Request::for_test("GET", "/api/me");
        cookie_header(&mut me, &res);
        let me_res = handle(&state, me);
        assert_eq!(me_res.status, 200, "{}", String::from_utf8_lossy(&me_res.body));
        assert_eq!(json_body(&me_res).get_str("email"), Some("ada@example.com"));

        let mut signin = Request::for_test("POST", "/api/signin");
        signin.set_test_body(br#"{"email":"ada@example.com","password":"secret1"}"#.to_vec());
        let si = handle(&state, signin);
        assert_eq!(si.status, 200, "{}", String::from_utf8_lossy(&si.body));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn unknown_api_is_404_text() {
        let (state, dir) = test_state();
        let res = handle(&state, Request::for_test("GET", "/api/nope"));
        assert_eq!(res.status, 404);
        assert_eq!(res.body, b"404 Not Found");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn spa_fallback_without_dist() {
        let (state, dir) = test_state();
        let res = handle(&state, Request::for_test("GET", "/app"));
        assert_eq!(res.status, 200);
        assert_eq!(res.body, b"Welcome to Skateboard API");
        std::fs::remove_dir_all(&dir).ok();
    }

    /// Sign up, then return the state and the signup response (which carries
    /// the auth cookies and the CSRF token).
    fn signed_up(state: &AppState, email: &str) -> Response {
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(
            format!(r#"{{"email":"{email}","password":"secret1","name":"P"}}"#).into_bytes(),
        );
        let res = handle(state, req);
        assert_eq!(res.status, 201, "{}", String::from_utf8_lossy(&res.body));
        res
    }

    /// POST `/api/portal` with `customer_id`, carrying the cookies from `signup`.
    fn portal_request(state: &AppState, signup: &Response, customer_id: &str) -> Response {
        let mut req = Request::for_test("POST", "/api/portal");
        cookie_header(&mut req, signup);
        req.set_test_body(format!(r#"{{"customerID":"{customer_id}"}}"#).into_bytes());
        handle(state, req)
    }

    #[test]
    fn redact_email_keeps_only_a_hint_and_the_domain() {
        assert_eq!(redact_email("alice@example.com"), "a***@example.com");
        assert_eq!(redact_email("@example.com"), "***@example.com");
        assert_eq!(redact_email("not-an-email"), "[redacted]");
        assert_eq!(redact_email(""), "[redacted]");
    }

    #[test]
    fn redact_email_never_contains_the_local_part() {
        let redacted = redact_email("verylongname@example.com");
        assert!(!redacted.contains("verylongname"));
        assert!(!redacted.contains("erylongname"));
    }

    #[test]
    fn usage_track_requires_csrf() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "usage@example.com");
        let mut req = Request::for_test("POST", "/api/usage");
        replay_cookies(&mut req, &[&signup], false);
        req.set_test_body(br#"{"operation":"track"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 403, "{}", String::from_utf8_lossy(&res.body));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn signout_requires_csrf() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "out@example.com");
        let mut req = Request::for_test("POST", "/api/signout");
        replay_cookies(&mut req, &[&signup], false);
        let res = handle(&state, req);
        assert_eq!(res.status, 403, "{}", String::from_utf8_lossy(&res.body));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn csrf_store_miss_is_refused_not_auto_accepted() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "miss@example.com");
        let user_id = state
            .pool
            .find_user(&UserQuery::Email("miss@example.com".into()))
            .expect("query")
            .expect("user")
            .id;
        // Simulates a restart: the cookie and header survive, the store does not.
        state.csrf.remove(&user_id);

        let mut req = Request::for_test("PUT", "/api/me");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(br#"{"name":"Renamed"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(
            res.status, 403,
            "a store miss must not accept the request: {}",
            String::from_utf8_lossy(&res.body)
        );
        // The name must be unchanged, proving the mutation did not run.
        let after = state
            .pool
            .find_user(&UserQuery::Id(user_id))
            .expect("query")
            .expect("user");
        assert_eq!(after.name, "P");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn csrf_refusal_issues_a_token_usable_on_retry() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "retry@example.com");
        let user_id = state
            .pool
            .find_user(&UserQuery::Email("retry@example.com".into()))
            .expect("query")
            .expect("user")
            .id;
        state.csrf.remove(&user_id);

        let mut first = Request::for_test("PUT", "/api/me");
        replay_cookies(&mut first, &[&signup], true);
        first.set_test_body(br#"{"name":"Renamed"}"#.to_vec());
        let refused = handle(&state, first);
        assert_eq!(refused.status, 403);

        // Retry with the replacement token the refusal set.
        let mut second = Request::for_test("PUT", "/api/me");
        replay_cookies(&mut second, &[&signup, &refused], true);
        second.set_test_body(br#"{"name":"Renamed"}"#.to_vec());
        let res = handle(&state, second);
        assert_eq!(res.status, 200, "{}", String::from_utf8_lossy(&res.body));
        assert_eq!(json_body(&res).get_str("name"), Some("Renamed"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn portal_refuses_a_customer_id_the_caller_does_not_own() {
        let (mut state, dir) = test_state();
        // A configured client makes the route reach the authorization check; the
        // check itself is local, so a refusal never touches the network.
        state.stripe = Some(crate::stripe_worker::StripeWorker::spawn(
            crate::stripe::StripeClient::new("sk_test_unused".into()),
        ));
        let signup = signed_up(&state, "noone@example.com");

        // This account has no subscription, so it owns no Stripe customer.
        let res = portal_request(&state, &signup, "cus_someoneElsesCustomer");
        assert_eq!(res.status, 403, "{}", String::from_utf8_lossy(&res.body));
        assert_eq!(json_body(&res).get_str("error"), Some("Unauthorized customerID"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn portal_refuses_a_customer_id_belonging_to_another_subscriber() {
        let (mut state, dir) = test_state();
        state.stripe = Some(crate::stripe_worker::StripeWorker::spawn(
            crate::stripe::StripeClient::new("sk_test_unused".into()),
        ));
        let signup = signed_up(&state, "mine@example.com");

        let user = state
            .pool
            .find_user(&UserQuery::Email("mine@example.com".into()))
            .expect("query")
            .expect("user");
        state
            .pool
            .update_user_subscription(
                &user.id,
                &Subscription {
                    stripe_id: "cus_mine".into(),
                    expires: None,
                    status: "active".into(),
                },
            )
            .expect("set subscription");

        let res = portal_request(&state, &signup, "cus_theirs");
        assert_eq!(res.status, 403, "{}", String::from_utf8_lossy(&res.body));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn put_me_requires_csrf() {
        let (state, dir) = test_state();
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(br#"{"email":"csrf@example.com","password":"secret1","name":"C"}"#.to_vec());
        let signed = handle(&state, req);
        assert_eq!(signed.status, 201);

        let mut put = Request::for_test("PUT", "/api/me");
        cookie_header(&mut put, &signed);
        // cookie_header also copies x-csrf-token from Set-Cookie; strip it to
        // prove a missing header is rejected.
        put.headers = crate::http::Headers::from_pairs(
            put.headers
                .iter()
                .filter(|(k, _)| !k.eq_ignore_ascii_case("x-csrf-token"))
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect(),
        );
        put.set_test_body(br#"{"name":"New"}"#.to_vec());
        let res = handle(&state, put);
        assert_eq!(res.status, 403);
        std::fs::remove_dir_all(&dir).ok();
    }


    #[test]
    fn auth_rate_limit_blocks_after_cap() {
        let (state, dir) = test_state();
        let now = config::now_ms();
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("198.51.100.9", now).limited);
        }
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "198.51.100.9".into();
        req.set_test_body(br#"{"email":"overflow@example.com","password":"secret1","name":"R"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 429);
        assert!(res.headers.iter().any(|(k, _)| k.eq_ignore_ascii_case("retry-after")));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn auth_rate_limit_honors_forwarded_for_when_trust_proxy_set() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        // SAFETY: ENV_LOCK is held for the whole test so TRUST_PROXY cannot race.
        unsafe {
            std::env::set_var("TRUST_PROXY", "1");
        }
        let (state, dir) = test_state_locked();
        let now = config::now_ms();
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("198.51.100.10", now).limited);
        }
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "10.0.0.1".into();
        req.set_test_header("x-forwarded-for", "198.51.100.10");
        req.set_test_body(br#"{"email":"xff-over@example.com","password":"secret1","name":"R"}"#.to_vec());
        assert_eq!(handle(&state, req).status, 429);
        // Different forwarded IP still allowed (socket peer is the same proxy).
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "10.0.0.1".into();
        req.set_test_header("x-forwarded-for", "198.51.100.11");
        req.set_test_body(br#"{"email":"xff-other@example.com","password":"secret1","name":"R"}"#.to_vec());
        assert_eq!(handle(&state, req).status, 201);
        unsafe {
            std::env::remove_var("TRUST_PROXY");
        }
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn spoofed_leading_forwarded_for_cannot_mint_a_fresh_rate_limit_bucket() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        // SAFETY: ENV_LOCK is held for the whole test so TRUST_PROXY cannot race.
        unsafe {
            std::env::set_var("TRUST_PROXY", "1");
        }
        let (state, dir) = test_state_locked();
        let now = config::now_ms();
        // Exhaust the window for the address the single trusted proxy observed.
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("198.51.100.10", now).limited);
        }
        // The client prepends junk; the proxy appends the address it saw. Taking
        // the leftmost hop would hand the attacker an unused bucket every time.
        for (i, spoof) in ["203.0.113.1", "203.0.113.2", "203.0.113.3"].iter().enumerate() {
            let mut req = Request::for_test("POST", "/api/signup");
            req.peer_ip = "10.0.0.1".into();
            req.set_test_header("x-forwarded-for", &format!("{spoof}, 198.51.100.10"));
            req.set_test_body(
                format!(r#"{{"email":"spoof{i}@example.com","password":"secret1","name":"R"}}"#)
                    .into_bytes(),
            );
            assert_eq!(handle(&state, req).status, 429, "spoofed hop {spoof} escaped the limit");
        }
        unsafe {
            std::env::remove_var("TRUST_PROXY");
        }
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn forwarded_for_shorter_than_trusted_hops_falls_back_to_peer_ip() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        // SAFETY: ENV_LOCK is held for the whole test so TRUST_PROXY cannot race.
        unsafe {
            std::env::set_var("TRUST_PROXY", "2");
        }
        let (state, dir) = test_state_locked();
        let now = config::now_ms();
        // Only one hop present but two are configured: fail closed to the socket
        // peer rather than trusting the client-supplied entry.
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("10.0.0.1", now).limited);
        }
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "10.0.0.1".into();
        req.set_test_header("x-forwarded-for", "203.0.113.9");
        req.set_test_body(br#"{"email":"short-chain@example.com","password":"secret1","name":"R"}"#.to_vec());
        assert_eq!(handle(&state, req).status, 429);
        unsafe {
            std::env::remove_var("TRUST_PROXY");
        }
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn put_me_rejects_malformed_json_as_bad_request() {
        let (state, dir) = test_state();
        let signed = signed_up(&state, "badjson@example.com");

        let mut put = Request::for_test("PUT", "/api/me");
        cookie_header(&mut put, &signed);
        put.set_test_body(b"{not json".to_vec());
        let res = handle(&state, put);

        assert_eq!(res.status, 400);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn health_reports_the_database_probe() {
        let (state, dir) = test_state();
        let body = json_body(&handle(&state, Request::for_test("GET", "/api/health")));

        assert_eq!(body.get_str("database"), Some("connected"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn webhook_cleanup_drops_only_expired_records() {
        let (state, dir) = test_state();
        let day_ms = 24 * 60 * 60 * 1000;
        let now = config::now_ms();
        state
            .pool
            .insert_webhook_event("evt_old", "invoice.paid", now - (WEBHOOK_RETENTION_DAYS + 1) * day_ms)
            .unwrap();
        state.pool.insert_webhook_event("evt_new", "invoice.paid", now).unwrap();

        run_webhook_cleanup(&state);

        assert!(state.pool.find_webhook_event("evt_old").unwrap().is_none());
        assert!(state.pool.find_webhook_event("evt_new").unwrap().is_some());
        std::fs::remove_dir_all(&dir).ok();
    }

    const WHSEC: &str = "whsec_test_route_secret";

    fn stripe_state_with_mock(mock: crate::stripe::StripeMock) -> (AppState, std::path::PathBuf) {
        let (mut state, dir) = test_state();
        let keys: Vec<String> = mock.prices.keys().cloned().collect();
        state.stripe = Some(crate::stripe_worker::StripeWorker::spawn(
            crate::stripe::StripeClient::with_mock(mock),
        ));
        state.stripe_lookup_keys = if keys.is_empty() {
            vec!["pro_monthly".into()]
        } else {
            keys
        };
        state.stripe_endpoint_secret = Some(WHSEC.into());
        (state, dir)
    }

    fn signed_webhook(payload: &[u8]) -> Request {
        let mut req = Request::for_test("POST", "/api/payment");
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(1_800_000_000);
        let header = crate::stripe::sign_webhook_header(WHSEC, payload, ts);
        req.set_test_header("stripe-signature", &header);
        req.set_test_body(payload.to_vec());
        req
    }

    fn user_subscription(state: &AppState, email: &str) -> Option<Subscription> {
        state
            .pool
            .find_user(&UserQuery::Email(email.into()))
            .expect("query")
            .expect("user")
            .subscription
    }

    #[test]
    fn payment_rejects_missing_signature() {
        let (state, dir) = stripe_state_with_mock(crate::stripe::StripeMock::default());
        let mut req = Request::for_test("POST", "/api/payment");
        req.set_test_body(br#"{"id":"evt_x"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 400);
        assert_eq!(json_body(&res).get_str("error"), Some("Missing signature"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn payment_rejects_bad_signature() {
        let (state, dir) = stripe_state_with_mock(crate::stripe::StripeMock::default());
        let mut req = Request::for_test("POST", "/api/payment");
        req.set_test_header("stripe-signature", "t=1800000000,v1=deadbeef");
        req.set_test_body(br#"{"id":"evt_bad","type":"customer.subscription.updated"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 400);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn payment_subscription_created_patches_user() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.customers
            .insert("cus_new".into(), "subber@example.com".into());
        let (state, dir) = stripe_state_with_mock(mock);
        let _ = signed_up(&state, "subber@example.com");

        let payload = br#"{
            "id":"evt_sub_created",
            "type":"customer.subscription.created",
            "data":{"object":{
                "id":"sub_1",
                "customer":"cus_new",
                "status":"active",
                "current_period_end":1893456000
            }}
        }"#;
        let res = handle(&state, signed_webhook(payload));
        assert_eq!(res.status, 200, "{}", String::from_utf8_lossy(&res.body));

        let sub = user_subscription(&state, "subber@example.com").expect("subscription");
        assert_eq!(sub.stripe_id, "cus_new");
        assert_eq!(sub.status, "active");
        assert_eq!(sub.expires, Some(1_893_456_000));

        assert!(state
            .pool
            .find_webhook_event("evt_sub_created")
            .expect("find")
            .is_some());
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn payment_subscription_updated_and_deleted() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.customers
            .insert("cus_life".into(), "life@example.com".into());
        let (state, dir) = stripe_state_with_mock(mock);
        let _ = signed_up(&state, "life@example.com");

        let updated = br#"{
            "id":"evt_sub_updated",
            "type":"customer.subscription.updated",
            "data":{"object":{
                "customer":"cus_life",
                "status":"past_due",
                "current_period_end":1890000000
            }}
        }"#;
        assert_eq!(handle(&state, signed_webhook(updated)).status, 200);
        let sub = user_subscription(&state, "life@example.com").expect("sub");
        assert_eq!(sub.status, "past_due");

        let deleted = br#"{
            "id":"evt_sub_deleted",
            "type":"customer.subscription.deleted",
            "data":{"object":{
                "customer":"cus_life",
                "status":"canceled",
                "current_period_end":1890000000
            }}
        }"#;
        assert_eq!(handle(&state, signed_webhook(deleted)).status, 200);
        let sub = user_subscription(&state, "life@example.com").expect("sub");
        assert_eq!(sub.status, "canceled");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn payment_checkout_session_completed_retrieves_subscription() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.subscriptions.insert(
            "sub_cs".into(),
            r#"{"id":"sub_cs","status":"active","current_period_end":1900000000}"#.into(),
        );
        let (state, dir) = stripe_state_with_mock(mock);
        let _ = signed_up(&state, "buyer@example.com");

        let payload = br#"{
            "id":"evt_cs_done",
            "type":"checkout.session.completed",
            "data":{"object":{
                "customer":"cus_buyer",
                "customer_email":"Buyer@Example.com",
                "subscription":"sub_cs"
            }}
        }"#;
        let res = handle(&state, signed_webhook(payload));
        assert_eq!(res.status, 200, "{}", String::from_utf8_lossy(&res.body));
        let sub = user_subscription(&state, "buyer@example.com").expect("sub");
        assert_eq!(sub.stripe_id, "cus_buyer");
        assert_eq!(sub.status, "active");
        assert_eq!(sub.expires, Some(1_900_000_000));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn payment_invoice_paid_and_payment_failed() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.customers
            .insert("cus_inv".into(), "invoice@example.com".into());
        mock.subscriptions.insert(
            "sub_inv".into(),
            r#"{"id":"sub_inv","status":"active","current_period_end":1910000000}"#.into(),
        );
        let (state, dir) = stripe_state_with_mock(mock);
        let _ = signed_up(&state, "invoice@example.com");

        let paid = br#"{
            "id":"evt_inv_paid",
            "type":"invoice.paid",
            "data":{"object":{
                "customer":"cus_inv",
                "subscription":"sub_inv"
            }}
        }"#;
        assert_eq!(handle(&state, signed_webhook(paid)).status, 200);
        let sub = user_subscription(&state, "invoice@example.com").expect("sub");
        assert_eq!(sub.status, "active");
        assert_eq!(sub.expires, Some(1_910_000_000));

        // payment_failed only logs when the user exists — still 200.
        let failed = br#"{
            "id":"evt_inv_fail",
            "type":"invoice.payment_failed",
            "data":{"object":{"customer":"cus_inv"}}
        }"#;
        assert_eq!(handle(&state, signed_webhook(failed)).status, 200);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn payment_event_is_idempotent() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.customers
            .insert("cus_idem".into(), "idem@example.com".into());
        let (state, dir) = stripe_state_with_mock(mock);
        let _ = signed_up(&state, "idem@example.com");

        let payload = br#"{
            "id":"evt_idem_1",
            "type":"customer.subscription.updated",
            "data":{"object":{
                "customer":"cus_idem",
                "status":"active",
                "current_period_end":1920000000
            }}
        }"#;
        assert_eq!(handle(&state, signed_webhook(payload)).status, 200);
        assert_eq!(handle(&state, signed_webhook(payload)).status, 200);
        // Still one row, still active.
        assert!(state
            .pool
            .find_webhook_event("evt_idem_1")
            .expect("find")
            .is_some());
        assert_eq!(
            user_subscription(&state, "idem@example.com")
                .expect("sub")
                .status,
            "active"
        );
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn checkout_returns_mocked_session() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.prices.insert("pro_monthly".into(), "price_pro".into());
        mock.checkout = Some(crate::stripe::CheckoutSession {
            id: "cs_test_123".into(),
            url: Some("https://checkout.stripe.com/c/pay/cs_test_123".into()),
            customer: Some("cus_from_checkout".into()),
        });
        let (state, dir) = stripe_state_with_mock(mock);
        let signup = signed_up(&state, "pay@example.com");

        let mut req = Request::for_test("POST", "/api/checkout");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(br#"{"email":"pay@example.com","lookup_key":"pro_monthly"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 200, "{}", String::from_utf8_lossy(&res.body));
        let body = json_body(&res);
        assert_eq!(body.get_str("id"), Some("cs_test_123"));
        assert_eq!(
            body.get_str("url"),
            Some("https://checkout.stripe.com/c/pay/cs_test_123")
        );
        assert_eq!(body.get_str("customerID"), Some("cus_from_checkout"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn checkout_rejects_unknown_lookup_key() {
        let (state, dir) = stripe_state_with_mock(crate::stripe::StripeMock::default());
        let signup = signed_up(&state, "pay2@example.com");
        let mut req = Request::for_test("POST", "/api/checkout");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(br#"{"email":"pay2@example.com","lookup_key":"missing"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 400);
        assert_eq!(json_body(&res).get_str("error"), Some("Unknown lookup_key"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn checkout_rejects_unlisted_lookup_key_even_when_stripe_has_it() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.prices.insert("internal_price".into(), "price_secret".into());
        let (mut state, dir) = stripe_state_with_mock(mock);
        state.stripe_lookup_keys = vec!["pro_monthly".into()];
        let signup = signed_up(&state, "pay3@example.com");
        let mut req = Request::for_test("POST", "/api/checkout");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(
            br#"{"email":"pay3@example.com","lookup_key":"internal_price"}"#.to_vec(),
        );
        let res = handle(&state, req);
        assert_eq!(res.status, 400);
        assert_eq!(json_body(&res).get_str("error"), Some("Unknown lookup_key"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn checkout_rejects_email_mismatch() {
        let mut mock = crate::stripe::StripeMock::default();
        mock.prices.insert("pro_monthly".into(), "price_pro".into());
        let (state, dir) = stripe_state_with_mock(mock);
        let signup = signed_up(&state, "real@example.com");
        let mut req = Request::for_test("POST", "/api/checkout");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(br#"{"email":"other@example.com","lookup_key":"pro_monthly"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 403);
        assert_eq!(json_body(&res).get_str("error"), Some("Email mismatch"));
        std::fs::remove_dir_all(&dir).ok();
    }

    fn insert_course(state: &AppState, slug: &str, title: &str) -> String {
        let id = crate::crypto::random_uuid_v4().expect("uuid");
        let now = iso_now();
        state
            .pool
            .with(|d| {
                d.run(
                    "INSERT INTO Courses
                      (_id, slug, title, description, difficulty, estimatedHours, tags, order_index,
                       published, guideCount, quizCount, repCount, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    &[
                        t(&id),
                        t(slug),
                        t(title),
                        db::Value::Null,
                        db::Value::Null,
                        db::Value::Null,
                        t("[]"),
                        db::Value::Int(1),
                        db::Value::Int(1),
                        db::Value::Int(0),
                        db::Value::Int(0),
                        db::Value::Int(0),
                        t(&now),
                        t(&now),
                    ],
                )
            })
            .expect("insert course");
        id
    }

    fn insert_guide(state: &AppState, course_id: &str, slug: &str, title: &str, content: &str) {
        let id = crate::crypto::random_uuid_v4().expect("uuid");
        let now = iso_now();
        state
            .pool
            .with(|d| {
                d.run(
                    "INSERT INTO Guides
                       (_id, courseId, slug, title, category, content, estimatedMinutes,
                        timeToProductive, timeToProficient, interviewReady, order_index,
                        published, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    &[
                        t(&id),
                        t(course_id),
                        t(slug),
                        t(title),
                        t("js"),
                        t(content),
                        db::Value::Int(5),
                        db::Value::Null,
                        db::Value::Null,
                        db::Value::Null,
                        db::Value::Int(1),
                        db::Value::Int(1),
                        t(&now),
                        t(&now),
                    ],
                )
            })
            .expect("insert guide");
    }

    #[test]
    fn courses_list_and_get() {
        let (state, dir) = test_state();
        let res = handle(&state, Request::for_test("GET", "/api/courses"));
        assert_eq!(res.status, 200);
        assert_eq!(json_body(&res).as_arr().map(|a| a.len()), Some(0));
        insert_course(&state, "js", "JavaScript");
        let res = handle(&state, Request::for_test("GET", "/api/courses"));
        assert_eq!(res.status, 200);
        let arr = json_body(&res);
        assert_eq!(arr.as_arr().map(|a| a.len()), Some(1));
        assert_eq!(arr.as_arr().unwrap()[0].get_str("slug"), Some("js"));
        assert_eq!(arr.as_arr().unwrap()[0].get("published"), Some(&Json::Bool(true)));
        let res = handle(&state, Request::for_test("GET", "/api/courses/js"));
        assert_eq!(res.status, 200);
        assert_eq!(json_body(&res).get_str("title"), Some("JavaScript"));
        let res = handle(&state, Request::for_test("GET", "/api/courses/missing"));
        assert_eq!(res.status, 404);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn literal_enroll_beats_parameterised_slug() {
        let (state, dir) = test_state();
        insert_course(&state, "js", "JavaScript");
        let signup = signed_up(&state, "enroll@example.com");
        let mut req = Request::for_test("POST", "/api/courses/js/enroll");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(b"{}".to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 200, "{}", String::from_utf8_lossy(&res.body));
        assert_eq!(json_body(&res).get_str("status"), Some("active"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn enroll_requires_auth_and_csrf() {
        let (state, dir) = test_state();
        insert_course(&state, "js", "JavaScript");
        let res = handle(&state, Request::for_test("POST", "/api/courses/js/enroll"));
        assert_eq!(res.status, 401);
        let signup = signed_up(&state, "csrf-enroll@example.com");
        let mut req = Request::for_test("POST", "/api/courses/js/enroll");
        replay_cookies(&mut req, &[&signup], false);
        req.set_test_body(b"{}".to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 403);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn guide_complete_and_progress_scoped_to_user() {
        let (state, dir) = test_state();
        let cid = insert_course(&state, "js", "JavaScript");
        insert_guide(&state, &cid, "closures", "Closures", "# Closures\n");
        let a = signed_up(&state, "a@example.com");
        let b = signed_up(&state, "b@example.com");
        let mut complete = Request::for_test("POST", "/api/courses/js/guides/closures/complete");
        replay_cookies(&mut complete, &[&a], true);
        complete.set_test_body(b"{}".to_vec());
        assert_eq!(handle(&state, complete).status, 200);
        let mut pa = Request::for_test("GET", "/api/progress/js");
        replay_cookies(&mut pa, &[&a], true);
        let body_a = json_body(&handle(&state, pa));
        assert_eq!(
            body_a
                .get("completedGuides")
                .and_then(Json::as_arr)
                .map(|x| x.len()),
            Some(1)
        );
        let mut pb = Request::for_test("GET", "/api/progress/js");
        replay_cookies(&mut pb, &[&b], true);
        let body_b = json_body(&handle(&state, pb));
        assert_eq!(
            body_b
                .get("completedGuides")
                .and_then(Json::as_arr)
                .map(|x| x.len()),
            Some(0)
        );
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn bookmark_delete_is_scoped_to_caller() {
        let (state, dir) = test_state();
        let a = signed_up(&state, "ba@example.com");
        let b = signed_up(&state, "bb@example.com");
        let mut create = Request::for_test("POST", "/api/courses/js/guides/g/bookmarks");
        replay_cookies(&mut create, &[&a], true);
        create.set_test_body(br#"{"sectionTitle":"Intro"}"#.to_vec());
        let created = handle(&state, create);
        assert_eq!(created.status, 200, "{}", String::from_utf8_lossy(&created.body));
        let id = json_body(&created).get_str("_id").unwrap().to_string();
        let mut steal = Request::for_test("DELETE", &format!("/api/bookmarks/{id}"));
        replay_cookies(&mut steal, &[&b], true);
        let stolen = handle(&state, steal);
        assert_eq!(stolen.status, 200);
        assert_eq!(json_body(&stolen).get_i64("deletedCount"), Some(0));
        let mut list = Request::for_test("GET", "/api/bookmarks");
        replay_cookies(&mut list, &[&a], true);
        let listed = json_body(&handle(&state, list));
        assert_eq!(listed.as_arr().map(|x| x.len()), Some(1));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn xai_token_without_key_is_503() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "voice@example.com");
        let mut req = Request::for_test("POST", "/api/xai/token");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(b"{}".to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 503);
        assert_eq!(
            json_body(&res).get_str("error"),
            Some("Voice is not configured (missing XAI_API_KEY).")
        );
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn iso_from_ms_formats_unix_epoch() {
        assert_eq!(iso_from_ms(0), "1970-01-01T00:00:00.000Z");
        assert_eq!(iso_from_ms(1_000), "1970-01-01T00:00:01.000Z");
    }
}
