import Header from '@stevederico/skateboard-ui/Header';
import { BookOpen, Bookmark, ChevronDown, ChevronRight, FileText, Loader, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';

/** A saved bookmark for a guide section, as returned by GET /bookmarks. */
interface Bookmark {
  _id: string;
  courseSlug: string;
  courseTitle?: string;
  guideSlug: string;
  guideTitle?: string;
  sectionTitle: string;
  sectionContent?: string;
  bookmarkedAt: string;
}

/** A guide grouping bookmarked sections. */
interface GuideGroup {
  guideSlug: string;
  guideTitle: string;
  sections: Bookmark[];
}

/** A course grouping bookmarked guides. */
interface CourseGroup {
  courseSlug: string;
  courseTitle: string;
  guides: GuideGroup[];
}

/**
 * Group a flat bookmark list into courses -> guides -> sections.
 *
 * @param bookmarks - Flat list of bookmarks
 * @returns Bookmarks grouped by course then guide
 */
function groupByCourse(bookmarks: Bookmark[]): CourseGroup[] {
  const groups: Record<string, {
    courseSlug: string;
    courseTitle: string;
    guides: Record<string, GuideGroup>;
  }> = {};
  bookmarks.forEach(bookmark => {
    const key = bookmark.courseSlug;
    if (!groups[key]) {
      groups[key] = {
        courseSlug: bookmark.courseSlug,
        courseTitle: bookmark.courseTitle || bookmark.courseSlug,
        guides: {}
      };
    }
    const guideKey = bookmark.guideSlug;
    if (!groups[key].guides[guideKey]) {
      groups[key].guides[guideKey] = {
        guideSlug: bookmark.guideSlug,
        guideTitle: bookmark.guideTitle || bookmark.guideSlug,
        sections: []
      };
    }
    groups[key].guides[guideKey].sections.push(bookmark);
  });

  return Object.values(groups).map(course => ({
    ...course,
    guides: Object.values(course.guides)
  }));
}

/** Props for {@link BookmarkItem}. */
interface BookmarkItemProps {
  bookmark: Bookmark;
  onRemove: (id: string) => Promise<void> | void;
  onNavigate: (bookmark: Bookmark) => void;
}

function BookmarkItem({ bookmark, onRemove, onNavigate }: BookmarkItemProps) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setRemoving(true);
    await onRemove(bookmark._id);
  };

  return (
    <div
      onClick={() => onNavigate(bookmark)}
      className="flex items-start gap-3 p-3 rounded-lg cursor-pointer bg-accent/50 hover:bg-accent transition-all"
      data-umami-event="bookmark-item-clicked"
    >
      <Bookmark size={16} className="text-yellow-400 mt-1 flex-shrink-0"/>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{bookmark.sectionTitle}</div>
        {bookmark.sectionContent && (
          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {bookmark.sectionContent}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-2">
          {new Date(bookmark.bookmarkedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="p-1 opacity-40 hover:opacity-100 hover:text-red-400 transition-all cursor-pointer"
        title="Remove bookmark"
        data-umami-event="bookmark-removed"
      >
        {removing ? (
          <Loader size={14} className="animate-spin"/>
        ) : (
          <X size={14}/>
        )}
      </button>
    </div>
  );
}

export default function BookmarksView() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getBackendURL()}/bookmarks`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data: Bookmark[] = await response.json();
          setBookmarks(data);
          const courseKeys = new Set(data.map(b => b.courseSlug));
          const guideKeys = new Set(data.map(b => `${b.courseSlug}:${b.guideSlug}`));
          setExpandedCourses(courseKeys);
          setExpandedGuides(guideKeys);
        }
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemove = async (bookmarkId: string) => {
    try {
      await fetch(`${getBackendURL()}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-csrf-token': getCSRFToken() ?? ''
        }
      });
      setBookmarks(prev => prev.filter(b => b._id !== bookmarkId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  const handleNavigate = (bookmark: Bookmark) => {
    const sectionId = bookmark.sectionTitle.toLowerCase().replace(/\s+/g, '-');
    navigate(`/app/courses/${bookmark.courseSlug}/guides/${bookmark.guideSlug}#${sectionId}`);
  };

  const toggleCourse = (courseSlug: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseSlug)) {
        next.delete(courseSlug);
      } else {
        next.add(courseSlug);
      }
      return next;
    });
  };

  const toggleGuide = (key: string) => {
    setExpandedGuides(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const grouped = groupByCourse(bookmarks);

  if (loading) {
    return (
      <>
        <Header title="Bookmarks" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading bookmarks...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Bookmarks" />
      <div className="p-6 max-w-4xl mx-auto" data-section-id="bookmarks-view">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark size={48} className="mx-auto mb-4 text-muted-foreground"/>
            <h2 className="text-xl font-semibold mb-2">No Bookmarks Yet</h2>
            <p className="text-muted-foreground mb-6">
              Bookmark sections in guides to quickly find them later.
            </p>
            <button
              onClick={() => navigate('/app/courses')}
              className="bg-app text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all cursor-pointer"
              data-umami-event="bookmarks-browse-courses-clicked"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
            </div>

            {grouped.map(course => (
              <div key={course.courseSlug} className="bg-accent rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCourse(course.courseSlug)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/80 transition-all cursor-pointer"
                  data-umami-event="bookmarks-course-toggled"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-app"/>
                    <span className="font-semibold">{course.courseTitle}</span>
                    <span className="text-sm text-muted-foreground">
                      ({course.guides.reduce((sum, g) => sum + g.sections.length, 0)})
                    </span>
                  </div>
                  {expandedCourses.has(course.courseSlug) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {expandedCourses.has(course.courseSlug) && (
                  <div className="px-4 pb-4 space-y-3">
                    {course.guides.map(guide => {
                      const guideKey = `${course.courseSlug}:${guide.guideSlug}`;
                      return (
                        <div key={guide.guideSlug}>
                          <button
                            onClick={() => toggleGuide(guideKey)}
                            className="w-full flex items-center justify-between py-2 text-sm hover:text-app transition-all cursor-pointer"
                            data-umami-event="bookmarks-guide-toggled"
                          >
                            <span className="flex items-center gap-2">
                              <FileText size={14}/>
                              {guide.guideTitle}
                              <span className="text-muted-foreground">({guide.sections.length})</span>
                            </span>
                            {expandedGuides.has(guideKey) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>

                          {expandedGuides.has(guideKey) && (
                            <div className="ml-6 mt-2 space-y-2">
                              {guide.sections.map(bookmark => (
                                <BookmarkItem
                                  key={bookmark._id}
                                  bookmark={bookmark}
                                  onRemove={handleRemove}
                                  onNavigate={handleNavigate}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
