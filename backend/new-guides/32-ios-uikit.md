UIKit Chapter Overview


Core Architecture

UIApplication is the singleton managing the app lifecycle, event loop, and state transitions
UIApplicationDelegate handles app-level events: launch, backgrounding, termination, URL handling, push registration
UISceneDelegate manages per-window lifecycle in multi-window apps (iOS 13+)
UIWindow is the root container that hosts your view hierarchy and dispatches events
UIScreen represents physical display properties, bounds, scale, and brightness
Responder chain propagates events through UIResponder subclasses until handled or discarded

View Controllers

UIViewController manages a view hierarchy, handles rotations, and coordinates with navigation
loadView() creates the root view programmatically; override only when not using storyboards
viewDidLoad() fires once after the view loads into memory
viewWillAppear(_:) and viewDidAppear(_:) fire every time the view becomes visible
viewWillDisappear(_:) and viewDidDisappear(_:) fire when leaving the screen
viewWillLayoutSubviews() and viewDidLayoutSubviews() fire before and after layout passes
didReceiveMemoryWarning() signals low memory; release caches and non-essential resources
View controller containment via addChild(), willMove(toParent:), didMove(toParent:)
present(_:animated:completion:) for modal presentation, dismiss(animated:completion:) to close
modalPresentationStyle controls modal appearance: .fullScreen, .pageSheet, .overCurrentContext
modalTransitionStyle controls animation: .coverVertical, .crossDissolve, .flipHorizontal
definesPresentationContext determines which controller's view contains the presented view
providesPresentationContextTransitionStyle lets the presenting controller define transition style

UIView Fundamentals

UIView is the base class for all visual elements; manages drawing, layout, and touch handling
frame is position and size in superview's coordinate system
bounds is position and size in the view's own coordinate system
center is the midpoint of the frame in superview coordinates
transform applies 2D affine transformations: rotation, scale, translation
transform3D applies 3D CATransform3D for perspective and z-axis transformations
alpha controls opacity; 0 is invisible, 1 is fully opaque
isHidden toggles visibility without removing from hierarchy
isOpaque hints to the compositor that the view has no transparency (optimization)
clipsToBounds clips subviews to the view's bounds
contentMode defines how content fills bounds: .scaleAspectFit, .scaleAspectFill, .center
tintColor propagates down the hierarchy for template images and controls
backgroundColor sets the fill color
layer is the underlying CALayer for Core Animation manipulation
addSubview(_:), removeFromSuperview(), insertSubview(_:at:), bringSubviewToFront(_:)
layoutSubviews() is called during layout passes; override for custom layout logic
setNeedsLayout() schedules a layout pass; layoutIfNeeded() forces immediate layout
setNeedsDisplay() marks the view for redrawing; draw(_:) performs custom drawing
intrinsicContentSize returns natural size for Auto Layout
sizeThatFits(_:) returns optimal size for given bounds; sizeToFit() resizes to fit content
systemLayoutSizeFitting(_:) computes Auto Layout size for given target size
alignmentRectInsets adjusts alignment rect for views with visual embellishments
safeAreaInsets provides insets for notches, home indicators, and navigation bars
safeAreaLayoutGuide is a layout guide respecting safe areas
layoutMarginsGuide provides layout guide for margin-based constraints
directionalLayoutMargins uses leading/trailing for RTL support
insetsLayoutMarginsFromSafeArea controls whether margins include safe area insets
semanticContentAttribute controls RTL mirroring behavior
effectiveUserInterfaceLayoutDirection returns actual layout direction after semantic evaluation
point(inside:with:) determines hit testing bounds; override for custom hit areas
hitTest(_:with:) returns the deepest subview containing the point
convert(_:to:) and convert(_:from:) translate points/rects between coordinate systems

Auto Layout

NSLayoutConstraint defines relationships between view attributes
translatesAutoresizingMaskIntoConstraints must be false for programmatic constraints
NSLayoutAnchor provides type-safe constraint creation: leadingAnchor, topAnchor, widthAnchor
activate(_:) and deactivate(_:) batch-manage constraint activation
priority ranges from 1-1000; .required (1000), .defaultHigh (750), .defaultLow (250)
constant is the fixed offset or size value in a constraint
multiplier scales the relationship between attributes
relation is .equal, .lessThanOrEqual, or .greaterThanOrEqual
Content hugging resists stretching; content compression resists shrinking
setContentHuggingPriority(_:for:) and setContentCompressionResistancePriority(_:for:)
UILayoutGuide creates invisible rectangular regions for layout purposes
UIStackView manages linear arrangements with axis, distribution, alignment, spacing
Stack view distribution: .fill, .fillEqually, .fillProportionally, .equalSpacing, .equalCentering
isLayoutMarginsRelativeArrangement makes stack view use layout margins
Constraint debugging: constraintsAffectingLayout(for:), hasAmbiguousLayout, exerciseAmbiguityInLayout()
Visual Format Language: "H:|-[view1]-[view2]-|" for horizontal layout strings
NSLayoutConstraint.constraints(withVisualFormat:options:metrics:views:)
systemSpacingAfter and systemSpacingBelow use system-defined spacing values
Readable content guide constrains width for optimal text readability
Keyboard layout guide automatically tracks keyboard frame (iOS 15+)

Responder Chain & Events

UIResponder is the base class for objects that respond to events
next returns the next responder in the chain; nil terminates the chain
isFirstResponder indicates whether the responder currently receives events
becomeFirstResponder() and resignFirstResponder() manage first responder status
canBecomeFirstResponder and canResignFirstResponder control responder eligibility
touchesBegan(_:with:), touchesMoved(_:with:), touchesEnded(_:with:), touchesCancelled(_:with:)
UITouch contains touch location, timestamp, phase, force, and altitude/azimuth for Pencil
UIEvent wraps one or more touches and provides event type and subtype
pressesBegan(_:with:), pressesEnded(_:with:) handle physical button presses
motionBegan(_:with:), motionEnded(_:with:) detect shake gestures
UIPress represents physical button state for keyboards and game controllers
Target-action pattern: addTarget(_:action:for:) connects controls to methods
UIControl.Event includes .touchUpInside, .valueChanged, .editingChanged, .primaryActionTriggered
sendActions(for:) programmatically triggers control events
UICommand and UIKeyCommand handle keyboard shortcuts and menu commands
keyCommands property exposes available keyboard shortcuts
canPerformAction(_:withSender:) validates whether an action is currently available
validate(_:) updates command state (enabled, title, image) before display
buildMenu(with:) dynamically constructs context menus
Undo manager accessed via undoManager; responders inherit from parent if nil

Gesture Recognizers

UIGestureRecognizer is the abstract base class for gesture detection
UITapGestureRecognizer detects single or multiple taps
UILongPressGestureRecognizer detects press-and-hold with configurable duration
UIPanGestureRecognizer tracks dragging with translation and velocity
UISwipeGestureRecognizer detects directional swipes
UIPinchGestureRecognizer detects two-finger pinch with scale and velocity
UIRotationGestureRecognizer detects two-finger rotation
UIScreenEdgePanGestureRecognizer detects pans starting from screen edges
UIHoverGestureRecognizer detects pointer hovering (iPadOS, Catalyst)
state property: .possible, .began, .changed, .ended, .cancelled, .failed
location(in:) and location(ofTouch:in:) return touch positions
translation(in:) and velocity(in:) for pan gestures
setTranslation(_:in:) resets pan translation during handling
numberOfTouches returns current touch count
require(toFail:) creates dependency between recognizers
delegate methods control simultaneous recognition and failure requirements
gestureRecognizer(_:shouldRecognizeSimultaneouslyWith:) enables concurrent gestures
gestureRecognizer(_:shouldRequireFailureOf:) creates dynamic failure requirements
delaysTouchesBegan and delaysTouchesEnded control touch delivery timing
cancelsTouchesInView prevents touch delivery to the view when recognized
allowedTouchTypes and allowedPressTypes filter input types
name property for debugging gesture recognizers

Navigation & Container Controllers

UINavigationController manages a stack-based navigation hierarchy
pushViewController(_:animated:) and popViewController(animated:) modify the stack
popToRootViewController(animated:) returns to the root
setViewControllers(_:animated:) replaces the entire stack
viewControllers is the mutable array of stacked controllers
topViewController is the visible controller; visibleViewController includes modals
navigationBar is the UINavigationBar instance
toolbar is the optional bottom UIToolbar
isToolbarHidden and setToolbarHidden(_:animated:) control toolbar visibility
hidesBarsOnTap, hidesBarsOnSwipe, hidesBarsWhenKeyboardAppears for auto-hiding
UINavigationItem configures per-controller navigation bar content
title, largeTitleDisplayMode, backBarButtonItem, backButtonTitle
leftBarButtonItems, rightBarButtonItems for navigation bar buttons
titleView replaces the title with a custom view
searchController embeds a UISearchController in the navigation bar
hidesSearchBarWhenScrolling controls search bar visibility on scroll
UINavigationBarAppearance configures bar appearance declaratively (iOS 13+)
standardAppearance, compactAppearance, scrollEdgeAppearance
UITabBarController manages a tab-based interface
viewControllers is the array of tab controllers
selectedViewController and selectedIndex control active tab
tabBar is the UITabBar instance
UITabBarItem configures tab appearance: title, image, selectedImage, badgeValue
UITabBarAppearance configures tab bar appearance declaratively
UISplitViewController manages master-detail interfaces
viewControllers contains primary and secondary controllers
preferredDisplayMode: .automatic, .oneBesideSecondary, .oneOverSecondary
displayModeButtonItem provides collapse/expand toggle
preferredPrimaryColumnWidthFraction and maximumPrimaryColumnWidth
showDetailViewController(_:sender:) for adaptive detail presentation
collapseSecondaryViewController(_:for:) delegate method for collapse behavior
UIPageViewController manages page-based navigation
dataSource provides view controllers for pages
setViewControllers(_:direction:animated:completion:) sets visible pages
transitionStyle: .pageCurl or .scroll
navigationOrientation: .horizontal or .vertical
spineLocation for page curl style positioning

Table Views

UITableView displays scrollable single-column lists
style: .plain, .grouped, .insetGrouped
dataSource provides cell count and configuration
delegate handles selection, editing, and row heights
numberOfSections(in:) returns section count
tableView(_:numberOfRowsInSection:) returns row count per section
tableView(_:cellForRowAt:) returns configured cells
dequeueReusableCell(withIdentifier:for:) recycles cells efficiently
register(_:forCellReuseIdentifier:) registers cell classes or nibs
UITableViewCell is the base cell class
Cell styles: .default, .value1, .value2, .subtitle
textLabel, detailTextLabel, imageView are standard cell subviews (deprecated)
contentConfiguration and UIListContentConfiguration for modern cell configuration
backgroundConfiguration for modern background styling
accessories array for modern accessory configuration
accessoryType: .none, .disclosureIndicator, .detailButton, .checkmark
selectionStyle and setSelected(_:animated:)
contentView is the container for custom cell content
tableView(_:heightForRowAt:) returns explicit row heights
estimatedRowHeight and rowHeight = UITableView.automaticDimension for self-sizing
tableView(_:viewForHeaderInSection:) and tableView(_:viewForFooterInSection:)
sectionHeaderHeight, sectionFooterHeight, estimatedSectionHeaderHeight
tableView(_:didSelectRowAt:) handles row selection
tableView(_:commit:forRowAt:) handles delete and insert editing actions
tableView(_:canEditRowAt:) enables per-row editing
tableView(_:canMoveRowAt:) enables row reordering
tableView(_:moveRowAt:to:) commits row moves
setEditing(_:animated:) toggles edit mode
tableView(_:leadingSwipeActionsConfigurationForRowAt:) for leading swipe actions
tableView(_:trailingSwipeActionsConfigurationForRowAt:) for trailing swipe actions
UISwipeActionsConfiguration and UIContextualAction for swipe actions
insertRows(at:with:), deleteRows(at:with:), moveRow(at:to:)
insertSections(_:with:), deleteSections(_:with:), moveSection(_:toSection:)
performBatchUpdates(_:completion:) groups multiple changes
reloadData() refreshes entire table
reloadRows(at:with:) and reloadSections(_:with:) for partial reloads
reconfigureRows(at:) updates cells without full reload (iOS 15+)
beginUpdates() and endUpdates() for legacy batch updates
indexPathForSelectedRow and indexPathsForSelectedRows
selectRow(at:animated:scrollPosition:) programmatic selection
deselectRow(at:animated:) clears selection
scrollToRow(at:at:animated:) scrolls to specific row
UITableViewDiffableDataSource manages data with automatic diffing
NSDiffableDataSourceSnapshot represents data state for diffable data source
apply(_:animatingDifferences:) updates data source with snapshot
sectionIndexTitles(for:) returns index titles for section index
tableView(_:sectionForSectionIndexTitle:at:) maps index titles to sections
tableHeaderView and tableFooterView for table-level headers/footers
separatorStyle, separatorColor, separatorInset
allowsSelection, allowsMultipleSelection, allowsSelectionDuringEditing
isPrefetchingEnabled and UITableViewDataSourcePrefetching for prefetching
dragDelegate and dropDelegate for drag and drop
hasActiveDrag and hasActiveDrop indicate active operations
cellLayoutMarginsFollowReadableWidth for readable content width

Collection Views

UICollectionView displays scrollable multi-column grids and custom layouts
UICollectionViewLayout is the abstract base for layout logic
UICollectionViewFlowLayout provides line-based grid layout
scrollDirection: .vertical or .horizontal
itemSize, minimumLineSpacing, minimumInteritemSpacing
sectionInset provides section padding
headerReferenceSize and footerReferenceSize for supplementary views
estimatedItemSize enables self-sizing cells
UICollectionViewDelegateFlowLayout provides per-item size customization
collectionView(_:layout:sizeForItemAt:) returns item sizes
UICollectionViewCompositionalLayout for complex, section-based layouts (iOS 13+)
NSCollectionLayoutItem, NSCollectionLayoutGroup, NSCollectionLayoutSection
NSCollectionLayoutSize with fractional, absolute, and estimated dimensions
NSCollectionLayoutDimension.fractionalWidth(_:), .fractionalHeight(_:), .absolute(_:), .estimated(_:)
orthogonalScrollingBehavior enables horizontal scrolling within vertical layouts
NSCollectionLayoutBoundarySupplementaryItem for headers and footers
NSCollectionLayoutDecorationItem for background decoration views
visibleItemsInvalidationHandler for scroll-driven effects
UICollectionLayoutListConfiguration for list-style layouts in collection views
UICollectionViewListCell for list-style cells
UICollectionViewDataSource provides cells and supplementary views
numberOfSections(in:) and collectionView(_:numberOfItemsInSection:)
collectionView(_:cellForItemAt:) returns configured cells
collectionView(_:viewForSupplementaryElementOfKind:at:) for headers/footers
UICollectionViewCell is the base cell class
contentView contains custom cell content
backgroundView and selectedBackgroundView for cell backgrounds
isSelected and isHighlighted state properties
contentConfiguration and backgroundConfiguration for modern cell configuration
UICollectionReusableView is the base class for supplementary views
dequeueReusableCell(withReuseIdentifier:for:) recycles cells
dequeueReusableSupplementaryView(ofKind:withReuseIdentifier:for:)
register(_:forCellWithReuseIdentifier:) registers cell classes/nibs
register(_:forSupplementaryViewOfKind:withReuseIdentifier:)
UICollectionViewDiffableDataSource manages data with automatic diffing
NSDiffableDataSourceSectionSnapshot for section-specific snapshots (iOS 14+)
apply(_:to:animatingDifferences:) applies section snapshot
CellRegistration and SupplementaryRegistration for modern cell registration (iOS 14+)
dequeueConfiguredReusableCell(using:for:item:) uses cell registration
UICollectionViewDelegate handles selection and highlighting
collectionView(_:didSelectItemAt:) handles item selection
collectionView(_:shouldSelectItemAt:) controls selection eligibility
collectionView(_:didHighlightItemAt:) and collectionView(_:didUnhighlightItemAt:)
indexPathsForSelectedItems and selectItem(at:animated:scrollPosition:)
allowsSelection, allowsMultipleSelection
isPrefetchingEnabled and UICollectionViewDataSourcePrefetching
dragDelegate and dropDelegate for drag and drop
reorderingCadence controls reordering animation during drag
performBatchUpdates(_:completion:) for animated changes
insertItems(at:), deleteItems(at:), moveItem(at:to:)
insertSections(_:), deleteSections(_:), moveSection(_:toSection:)
reloadItems(at:) and reconfigureItems(at:) for item updates
layoutAttributesForItem(at:) returns layout attributes for item
layoutAttributesForSupplementaryElement(ofKind:at:)
invalidateLayout() and invalidateLayout(with:)
UICollectionViewLayoutInvalidationContext for granular invalidation
UICollectionViewTransitionLayout for animated layout transitions
startInteractiveTransition(to:completion:) for interactive layout changes
UICollectionViewUpdateItem describes changes during batch updates
targetContentOffset(forProposedContentOffset:) adjusts scroll position after layout changes

Scroll Views

UIScrollView provides scrollable content larger than its bounds
contentSize defines the scrollable area dimensions
contentOffset is the current scroll position
setContentOffset(_:animated:) scrolls programmatically
contentInset adds padding around content
adjustedContentInset includes system insets (safe areas, bars)
contentInsetAdjustmentBehavior: .automatic, .never, .always, .scrollableAxes
scrollIndicatorInsets positions scroll indicators
isScrollEnabled, isDirectionalLockEnabled
isPagingEnabled snaps to page boundaries
bounces, alwaysBounceVertical, alwaysBounceHorizontal
bouncesZoom enables bounce at zoom limits
showsVerticalScrollIndicator, showsHorizontalScrollIndicator
indicatorStyle: .default, .black, .white
decelerationRate: .normal, .fast, or custom values
scrollsToTop enables status bar tap to scroll
keyboardDismissMode: .none, .onDrag, .interactive, .onDragWithAccessory
minimumZoomScale and maximumZoomScale set zoom bounds
zoomScale and setZoomScale(_:animated:)
zoom(to:animated:) zooms to show specific rect
viewForZooming(in:) delegate method returns zoomable view
scrollViewDidScroll(_:) fires during scrolling
scrollViewWillBeginDragging(_:) fires at drag start
scrollViewDidEndDragging(_:willDecelerate:) fires at drag end
scrollViewWillBeginDecelerating(_:) and scrollViewDidEndDecelerating(_:)
scrollViewDidEndScrollingAnimation(_:) fires after programmatic scroll
scrollViewShouldScrollToTop(_:) controls status bar tap behavior
scrollViewDidZoom(_:) fires during zooming
scrollViewWillBeginZooming(_:with:) and scrollViewDidEndZooming(_:with:atScale:)
panGestureRecognizer and pinchGestureRecognizer for customization
scrollRectToVisible(_:animated:) scrolls to make rect visible
touchesShouldBegin(_:with:in:) controls touch delivery to subviews
touchesShouldCancel(in:) controls touch cancellation
delaysContentTouches and canCancelContentTouches
UIRefreshControl provides pull-to-refresh
refreshControl property integrates refresh control
beginRefreshing() and endRefreshing() control refresh state
isRefreshing indicates active refresh

Text & Input

UILabel displays static text
text and attributedText for plain and styled text
font, textColor, textAlignment, lineBreakMode
numberOfLines limits line count; 0 for unlimited
adjustsFontSizeToFitWidth and minimumScaleFactor
allowsDefaultTighteningForTruncation tightens text before truncating
preferredMaxLayoutWidth constrains multi-line width for Auto Layout
UITextField provides single-line text input
text, attributedText, placeholder, attributedPlaceholder
font, textColor, textAlignment
borderStyle: .none, .line, .bezel, .roundedRect
clearButtonMode: .never, .whileEditing, .unlessEditing, .always
leftView, rightView with leftViewMode, rightViewMode
inputView replaces keyboard; inputAccessoryView adds toolbar above keyboard
keyboardType: .default, .emailAddress, .numberPad, .URL, .phonePad
returnKeyType: .default, .go, .search, .done, .next
autocapitalizationType, autocorrectionType, spellCheckingType
isSecureTextEntry masks password input
textContentType for autofill hints: .emailAddress, .password, .oneTimeCode
passwordRules specifies password requirements for generation
delegate methods: textFieldShouldReturn(_:), textField(_:shouldChangeCharactersIn:replacementString:)
textFieldDidBeginEditing(_:) and textFieldDidEndEditing(_:)
UITextView provides multi-line text input and display
text, attributedText, font, textColor, textAlignment
isEditable and isSelectable
dataDetectorTypes auto-links URLs, phone numbers, addresses
linkTextAttributes styles detected links
textContainerInset provides padding
textContainer is the underlying NSTextContainer
layoutManager is the NSLayoutManager for text layout
textStorage is the NSTextStorage backing the text
delegate methods for editing notifications and link interaction
textViewDidChange(_:) fires during editing
textView(_:shouldInteractWith:in:interaction:) handles link taps
UITextInputTraits protocol defines keyboard configuration
UITextInput protocol for custom text input controls
UITextPosition and UITextRange represent positions and ranges
markedTextRange and markedTextStyle for composing input
beginningOfDocument and endOfDocument text positions
selectedTextRange for selection management
UITextInteraction adds text selection and editing to custom views
UIEditMenuInteraction presents edit menus (cut, copy, paste)
UIFindInteraction provides find and replace UI (iOS 16+)
UIPasteControl provides secure paste UI
UITextDropDelegate and UITextDragDelegate for text drag/drop
UITextInputMode represents active keyboard language
activeInputModes lists available keyboards

Buttons & Controls

UIButton is the standard tappable button
configuration uses UIButton.Configuration for modern styling (iOS 15+)
UIButton.Configuration.plain(), .filled(), .gray(), .tinted(), .bordered(), .borderedTinted(), .borderedProminent()
configuration.title, configuration.image, configuration.subtitle
configuration.imagePadding, configuration.titlePadding, configuration.contentInsets
configuration.imagePlacement: .leading, .trailing, .top, .bottom
configuration.showsActivityIndicator displays spinner
configuration.baseBackgroundColor, configuration.baseForegroundColor
configurationUpdateHandler for dynamic configuration changes
setTitle(_:for:), setImage(_:for:), setBackgroundImage(_:for:) for legacy styling
setTitleColor(_:for:), setAttributedTitle(_:for:)
UIControl.State: .normal, .highlighted, .disabled, .selected, .focused
isEnabled, isSelected, isHighlighted
addTarget(_:action:for:) with .touchUpInside
UIButton.ButtonType: .system, .custom, .close, .detailDisclosure, .infoLight, .infoDark
UISwitch is a binary toggle
isOn and setOn(_:animated:)
onTintColor, thumbTintColor
preferredStyle: .automatic, .checkbox, .sliding
UISegmentedControl offers mutually exclusive options
selectedSegmentIndex and selectedSegmentTintColor
insertSegment(withTitle:at:animated:), insertSegment(with:at:animated:)
removeSegment(at:animated:), removeAllSegments()
setTitle(_:forSegmentAt:), setImage(_:forSegmentAt:)
setEnabled(_:forSegmentAt:), setWidth(_:forSegmentAt:)
isMomentary for momentary selection
UISlider provides continuous value selection
value, minimumValue, maximumValue
setValue(_:animated:)
minimumTrackTintColor, maximumTrackTintColor, thumbTintColor
minimumValueImage, maximumValueImage
isContinuous controls whether events fire during dragging
UIStepper provides increment/decrement buttons
value, minimumValue, maximumValue, stepValue
autorepeat, wraps, isContinuous
UIProgressView displays determinate progress
progress and setProgress(_:animated:)
progressViewStyle: .default, .bar
progressTintColor, trackTintColor
UIActivityIndicatorView shows indeterminate activity
startAnimating(), stopAnimating(), isAnimating
hidesWhenStopped auto-hides when stopped
style: .medium, .large
color sets spinner color
UIPageControl shows page indicators
numberOfPages, currentPage
hidesForSinglePage, pageIndicatorTintColor, currentPageIndicatorTintColor
setIndicatorImage(_:forPage:) for custom indicators
backgroundStyle: .automatic, .prominent, .minimal
allowsContinuousInteraction for scrubbing
UIDatePicker selects dates and times
date, minimumDate, maximumDate
datePickerMode: .date, .time, .dateAndTime, .countDownTimer
preferredDatePickerStyle: .automatic, .wheels, .compact, .inline
minuteInterval, countDownDuration
locale, calendar, timeZone
UIColorWell presents color picker (iOS 14+)
selectedColor, supportsAlpha
title for accessibility

Alerts & Action Sheets

UIAlertController presents alerts and action sheets
preferredStyle: .alert or .actionSheet
UIAlertController(title:message:preferredStyle:)
addAction(_:) adds UIAlertAction buttons
UIAlertAction(title:style:handler:) creates actions
UIAlertAction.Style: .default, .cancel, .destructive
preferredAction highlights a default action in alerts
addTextField(configurationHandler:) adds text input to alerts
textFields accesses added text fields
present(_:animated:completion:) to display
popoverPresentationController configures iPad action sheet positioning

Popovers & Presentations

UIPopoverPresentationController manages popover presentation
sourceView and sourceRect anchor the popover
barButtonItem anchors to bar button
permittedArrowDirections controls arrow positioning
passthroughViews allows interaction with underlying views
delegate handles adaptation and dismissal
UIPopoverPresentationControllerDelegate methods for customization
adaptivePresentationStyle(for:) controls adaptation to compact sizes
presentationController(_:viewControllerForAdaptivePresentationStyle:) provides alternate controller
UIPresentationController manages custom presentations
presentedViewController, presentingViewController
containerView is the view containing presentation chrome
presentedView is the presented controller's view
frameOfPresentedViewInContainerView returns presented view frame
presentationTransitionWillBegin() and presentationTransitionDidEnd(_:)
dismissalTransitionWillBegin() and dismissalTransitionDidEnd(_:)
UISheetPresentationController presents bottom sheets (iOS 15+)
detents array: .medium(), .large(), custom detents
selectedDetentIdentifier current detent
prefersGrabberVisible shows drag indicator
prefersScrollingExpandsWhenScrolledToEdge
prefersEdgeAttachedInCompactHeight
largestUndimmedDetentIdentifier controls dimming
UISheetPresentationController.Detent.custom for custom heights

Images & Media

UIImage represents bitmap and vector images
UIImage(named:) loads from asset catalog
UIImage(systemName:) loads SF Symbols
UIImage(contentsOfFile:) and UIImage(data:)
size, scale, imageOrientation
withTintColor(_:renderingMode:) applies tint
withRenderingMode(_:): .automatic, .alwaysOriginal, .alwaysTemplate
withConfiguration(_:) applies symbol configuration
UIImage.SymbolConfiguration for symbol weight, scale, and color
UIImage.SymbolConfiguration(pointSize:weight:scale:)
UIImage.SymbolConfiguration(hierarchicalColor:), (paletteColors:)
preparingForDisplay() and preparingThumbnail(of:) for async image preparation
byPreparingForDisplay() async version
pngData() and jpegData(compressionQuality:) for export
cgImage and ciImage for Core Graphics/Core Image interop
UIImageView displays images
image and highlightedImage
animationImages and animationDuration for frame animation
startAnimating(), stopAnimating(), isAnimating
contentMode controls aspect ratio handling
preferredSymbolConfiguration for SF Symbol display
UIImageSymbolEffect for animated symbol effects (iOS 17+)
addSymbolEffect(_:), removeSymbolEffect(_:)
setSymbolImage(_:contentTransition:) for symbol transitions
UIGraphicsImageRenderer creates images via drawing
UIGraphicsImageRenderer(size:) and image(actions:) block
UIGraphicsPDFRenderer creates PDFs
UIGraphicsImageRendererFormat configures image properties
PHPickerViewController selects photos from library (iOS 14+)
PHPickerConfiguration configures picker behavior
selectionLimit, filter, preferredAssetRepresentationMode
PHPickerResult contains selected assets
UIImagePickerController legacy photo/video picker and camera
sourceType: .photoLibrary, .camera, .savedPhotosAlbum
mediaTypes, allowsEditing, cameraCaptureMode
AVPlayerViewController plays video content
player is the AVPlayer instance
showsPlaybackControls, allowsPictureInPicturePlayback

Documents & Files

UIDocumentPickerViewController selects files from Files app
init(forOpeningContentTypes:asCopy:) for opening files
init(forExporting:asCopy:) for exporting files
allowsMultipleSelection, directoryURL
UIDocumentPickerDelegate receives selected URLs
UIDocumentBrowserViewController provides full document browser
allowedContentTypes, allowsDocumentCreation, allowsPickingMultipleItems
UIDocumentBrowserViewControllerDelegate handles document operations
UIDocument manages document lifecycle and iCloud sync
fileURL, localizedName, documentState
open(completionHandler:) and close(completionHandler:)
save(to:for:completionHandler:) persists changes
contents(forType:) and load(fromContents:ofType:) for serialization
updateChangeCount(_:) tracks document modifications
undoManager provides undo/redo support
UIDocumentState: .normal, .closed, .inConflict, .savingError, .editingDisabled
stateChangedNotification for state monitoring
QLPreviewController previews documents (QuickLook)
dataSource provides preview items
currentPreviewItemIndex controls visible item

Drawing & Graphics

UIBezierPath creates vector paths for drawing
init(rect:), init(ovalIn:), init(roundedRect:cornerRadius:)
init(arcCenter:radius:startAngle:endAngle:clockwise:)
move(to:), addLine(to:), addCurve(to:controlPoint1:controlPoint2:)
addQuadCurve(to:controlPoint:), addArc(withCenter:radius:startAngle:endAngle:clockwise:)
close() closes the path
append(_:) combines paths
lineWidth, lineCapStyle, lineJoinStyle, miterLimit
setLineDash(_:count:phase:) for dashed lines
stroke() and fill() draw the path
contains(_:) tests point containment
cgPath for Core Graphics interop
UIColor represents colors
UIColor.red, .blue, .systemBackground, .label, .tintColor
UIColor(red:green:blue:alpha:), UIColor(hue:saturation:brightness:alpha:)
UIColor(named:) loads from asset catalog
UIColor(dynamicProvider:) creates adaptive colors
resolvedColor(with:) resolves for trait collection
setFill() and setStroke() set current drawing colors
withAlphaComponent(_:) adjusts opacity
cgColor for Core Graphics
UIGraphicsGetCurrentContext() returns current CGContext
UIGraphicsPushContext(_:) and UIGraphicsPopContext()
UIRectFill(_:) and UIRectFrame(_:) convenience functions
Core Graphics drawing: context.setFillColor(_:), context.fill(_:)
context.saveGState() and context.restoreGState()
context.translateBy(x:y:), context.scaleBy(x:y:), context.rotate(by:)
context.clip(to:) and context.clip(to:mask:)
context.drawImage(_:in:) draws images
context.addPath(_:), context.strokePath(), context.fillPath()
NSAttributedString and draw(at:), draw(in:) for text rendering
UIFontDescriptor describes font attributes
UIFont.preferredFont(forTextStyle:) for Dynamic Type
UIFontMetrics scales custom fonts for Dynamic Type
UIFontMetrics(forTextStyle:).scaledFont(for:)

Core Animation & Layers

CALayer is the rendering and compositing primitive
frame, bounds, position, anchorPoint
transform is CATransform3D for 3D transformations
sublayerTransform applies to sublayers
backgroundColor, borderColor, borderWidth
cornerRadius and maskedCorners for selective rounding
shadowColor, shadowOffset, shadowOpacity, shadowRadius, shadowPath
mask is another layer used as alpha mask
opacity and isHidden
contents holds layer content (typically CGImage)
contentsGravity controls content positioning
contentsScale matches screen scale
isDoubleSided controls back-face visibility
masksToBounds clips sublayers
addSublayer(_:), insertSublayer(_:at:), removeFromSuperlayer()
setNeedsDisplay() and display(), draw(in:)
CAShapeLayer draws vector shapes
path is a CGPath; fillColor, strokeColor, lineWidth
lineCap, lineJoin, miterLimit
lineDashPattern, lineDashPhase
strokeStart and strokeEnd for partial strokes (animatable)
CATextLayer renders text
string (String or NSAttributedString), font, fontSize
foregroundColor, alignmentMode, truncationMode
isWrapped enables text wrapping
CAGradientLayer draws color gradients
colors, locations, startPoint, endPoint
type: .axial, .radial, .conic
CAReplicatorLayer duplicates sublayers
instanceCount, instanceDelay, instanceTransform
instanceColor, instanceRedOffset, instanceGreenOffset, instanceBlueOffset, instanceAlphaOffset
CAEmitterLayer creates particle effects
emitterCells, emitterPosition, emitterSize, emitterShape
birthRate, lifetime, renderMode
CAEmitterCell defines particle properties
CAScrollLayer provides scrollable layer content
CATransformLayer preserves 3D sublayer transforms
CATiledLayer draws content in tiles for large images
tileSize, levelsOfDetail, levelsOfDetailBias
CAMetalLayer for Metal rendering
CABasicAnimation animates single values
fromValue, toValue, byValue
keyPath specifies animated property
duration, repeatCount, autoreverses
timingFunction for easing
CAKeyframeAnimation animates through keyframes
values and keyTimes arrays
path for position animation along path
calculationMode: .linear, .discrete, .paced, .cubic
CAAnimationGroup combines multiple animations
animations array
CATransition animates layer changes
type: .fade, .moveIn, .push, .reveal
subtype: .fromLeft, .fromRight, .fromTop, .fromBottom
CASpringAnimation provides spring dynamics
damping, initialVelocity, mass, stiffness
settlingDuration computed settling time
CADisplayLink synchronizes drawing with display refresh
preferredFramesPerSecond, timestamp, targetTimestamp
add(to:forMode:) schedules on run loop
invalidate() stops the link
Implicit animations occur automatically for animatable properties outside transactions
CATransaction batches layer changes
CATransaction.begin() and CATransaction.commit()
CATransaction.setAnimationDuration(_:)
CATransaction.setDisableActions(_:) disables implicit animations
CATransaction.setCompletionBlock(_:)
add(_:forKey:) adds explicit animation to layer
removeAnimation(forKey:) and removeAllAnimations()
presentation() returns the layer's presentation tree copy
model() returns model layer from presentation layer

UIView Animations

UIView.animate(withDuration:animations:) for basic animations
UIView.animate(withDuration:delay:options:animations:completion:)
UIView.AnimationOptions: .curveEaseIn, .curveEaseOut, .curveLinear, .autoreverse, .repeat
.allowUserInteraction, .beginFromCurrentState, .layoutSubviews
.transitionFlipFromLeft, .transitionCrossDissolve
UIView.transition(with:duration:options:animations:completion:) for view transitions
UIView.transition(from:to:duration:options:completion:) replaces views
UIView.animateKeyframes(withDuration:delay:options:animations:completion:) for keyframe sequences
UIView.addKeyframe(withRelativeStartTime:relativeDuration:animations:)
UIViewPropertyAnimator provides interruptible animations (iOS 10+)
init(duration:curve:animations:)
init(duration:dampingRatio:animations:) for spring animations
fractionComplete controls/scrubs animation progress
startAnimation(), pauseAnimation(), stopAnimation(_:)
finishAnimation(at:) completes to .start, .current, or .end
addAnimations(_:) and addAnimations(_:delayFactor:)
addCompletion(_:) for completion handling
isInterruptible, isManualHitTestingEnabled, isUserInteractionEnabled
scrubsLinearly controls scrubbing behavior
pausesOnCompletion keeps animator active after completion
state: .inactive, .active, .stopped
isRunning and isReversed
continueAnimation(withTimingParameters:durationFactor:)
UISpringTimingParameters for spring-based timing
UICubicTimingParameters for bezier curve timing

View Controller Transitions

UIViewControllerTransitioningDelegate provides custom transitions
animationController(forPresented:presenting:source:) returns presentation animator
animationController(forDismissed:) returns dismissal animator
interactionControllerForPresentation(using:) returns interaction controller
interactionControllerForDismissal(using:) returns interaction controller
presentationController(forPresented:presenting:source:) returns custom presentation controller
UIViewControllerAnimatedTransitioning protocol for custom animators
transitionDuration(using:) returns animation duration
animateTransition(using:) performs the animation
interruptibleAnimator(using:) returns UIViewPropertyAnimator for interruptible transitions
animationEnded(_:) called when animation completes
UIViewControllerContextTransitioning provides transition context
containerView is the view containing both controllers
viewController(forKey:) returns .from or .to controller
view(forKey:) returns .from or .to view
initialFrame(for:) and finalFrame(for:) return view frames
completeTransition(_:) must be called when animation finishes
isAnimated, isInteractive, transitionWasCancelled
updateInteractiveTransition(_:), finishInteractiveTransition(), cancelInteractiveTransition()
UIPercentDrivenInteractiveTransition drives transitions by percentage
percentComplete, completionSpeed, completionCurve
update(_:), finish(), cancel()
UINavigationControllerDelegate provides navigation transition customization
navigationController(_:animationControllerFor:from:to:)
navigationController(_:interactionControllerFor:)
Hero third-party library popular for declarative transitions

Drag and Drop

UIDragInteraction enables drag sources
delegate provides drag items and customization
isEnabled, allowsSimultaneousRecognitionDuringLift
UIDragInteractionDelegate provides drag items
dragInteraction(_:itemsForBeginning:) returns [UIDragItem]
dragInteraction(_:itemsForAddingTo:withTouchAt:) adds items to existing drag
dragInteraction(_:previewForLifting:session:) returns custom lift preview
dragInteraction(_:sessionWillBegin:) notifies drag start
UIDragItem wraps NSItemProvider with local object
itemProvider for cross-process data
localObject for in-app data
previewProvider returns custom preview
UIDropInteraction enables drop targets
delegate handles drop operations
allowsSimultaneousDropSessions
UIDropInteractionDelegate handles drops
dropInteraction(_:canHandle:) returns supported types
dropInteraction(_:sessionDidUpdate:) returns UIDropProposal
dropInteraction(_:performDrop:) handles dropped data
UIDropProposal specifies drop operation
operation: .cancel, .copy, .move, .forbidden
UIDropSession provides drop information
items, localDragSession, location(in:)
loadObjects(ofClass:completion:) loads dropped objects
canLoadObjects(ofClass:) checks type support
UIDragSession provides drag information
items, allowsMoveOperation, isRestrictedToDraggingApplication
localContext for app-specific data
NSItemProvider transfers data across processes
registerDataRepresentation(forTypeIdentifier:visibility:loadHandler:)
loadDataRepresentation(forTypeIdentifier:completionHandler:)
suggestedName for file naming
UITableView and UICollectionView have built-in drag/drop delegates
tableView(_:itemsForBeginning:at:) for table drag
tableView(_:performDropWith:) for table drop
UITableViewDropCoordinator coordinates drop animations

Context Menus

UIContextMenuInteraction presents context menus
delegate provides menu configuration
location(in:) returns interaction location
menuAppearance: .rich or .compact
UIContextMenuInteractionDelegate configures menus
contextMenuInteraction(_:configurationForMenuAtLocation:) returns configuration
contextMenuInteraction(_:previewForHighlightingMenuWithConfiguration:) returns preview
contextMenuInteraction(_:willDisplayMenuFor:animator:) animates menu appearance
contextMenuInteraction(_:willEndFor:animator:) animates menu dismissal
UIContextMenuConfiguration defines menu content
init(identifier:previewProvider:actionProvider:)
previewProvider returns UIViewController for preview
actionProvider closure receives suggested actions, returns UIMenu
UIMenu contains actions and submenus
init(title:image:identifier:options:children:)
UIMenu.Options: .displayInline, .destructive, .singleSelection
UIAction is a menu action
init(title:image:identifier:discoverabilityTitle:attributes:state:handler:)
UIAction.Attributes: .disabled, .destructive, .hidden
UIMenuElement.State: .off, .on, .mixed
UICommand represents keyboard-driven commands
UIKeyCommand adds keyboard shortcuts
UIDeferredMenuElement loads menu content asynchronously
Table and collection views provide context menu delegates
tableView(_:contextMenuConfigurationForRowAt:point:) for table context menus
collectionView(_:contextMenuConfigurationForItemAt:point:) for collection context menus

Appearance & Theming

UIAppearance protocol enables global styling
appearance() returns appearance proxy for class
appearance(whenContainedInInstancesOf:) for contained appearance
appearance(for:) for trait-specific appearance
UITraitCollection describes interface environment
userInterfaceStyle: .light, .dark, .unspecified
userInterfaceIdiom: .phone, .pad, .mac, .tv, .carPlay, .vision
displayScale, preferredContentSizeCategory
horizontalSizeClass, verticalSizeClass: .compact, .regular
accessibilityContrast: .normal, .high
legibilityWeight: .regular, .bold
activeAppearance: .inactive, .active
layoutDirection: .leftToRight, .rightToLeft
displayGamut: .SRGB, .P3
forceTouchCapability: .unavailable, .available
UITraitCollection(traitsFrom:) combines trait collections
containsTraits(in:) checks trait containment
hasDifferentColorAppearance(comparedTo:) detects color changes
traitCollectionDidChange(_:) called when traits change
overrideUserInterfaceStyle forces light or dark mode on view/controller
UITraitDefinition protocol for custom traits (iOS 17+)
UITraitChangeObservable for trait change observation
registerForTraitChanges(_:handler:) observes specific traits
UITraitBridgedEnvironmentKey bridges traits to SwiftUI environment
UIColor system colors adapt automatically
.systemBackground, .secondarySystemBackground, .tertiarySystemBackground
.label, .secondaryLabel, .tertiaryLabel, .quaternaryLabel
.systemRed, .systemBlue, etc. optimized for light/dark
.tintColor returns current tint
Asset catalog colors support dark mode variants
UIVisualEffectView applies blur and vibrancy
UIBlurEffect(style:): .systemMaterial, .systemUltraThinMaterial, etc.
UIVibrancyEffect(blurEffect:style:) for text over blur
contentView contains subviews affected by effect

Accessibility

isAccessibilityElement marks element for VoiceOver
accessibilityLabel is the spoken description
accessibilityHint describes result of action
accessibilityValue represents current value
accessibilityTraits describes element behavior
.button, .link, .header, .image, .selected, .notEnabled
.adjustable for sliders, .updatesFrequently for live content
accessibilityIdentifier for UI testing
accessibilityFrame overrides default frame
accessibilityPath defines custom accessible path
accessibilityActivationPoint defines tap target
accessibilityElements orders child elements
accessibilityCustomActions adds custom VoiceOver actions
UIAccessibilityCustomAction defines custom action
shouldGroupAccessibilityChildren groups related elements
accessibilityElementsHidden hides subtree
accessibilityViewIsModal limits VoiceOver to modal view
accessibilityContainerType: .list, .table, .semanticGroup
accessibilityRespondsToUserInteraction indicates interactivity
accessibilityLanguage specifies element language
accessibilityTextualContext provides text context hints
UIAccessibilityPostNotification(_:_:) announces changes
.announcement speaks string
.screenChanged refocuses VoiceOver
.layoutChanged announces layout changes
UIAccessibility.isVoiceOverRunning checks VoiceOver state
UIAccessibility.isSwitchControlRunning checks Switch Control
UIAccessibility.isReduceMotionEnabled checks motion preference
UIAccessibility.isReduceTransparencyEnabled checks transparency preference
UIAccessibility.isBoldTextEnabled checks bold text preference
UIAccessibility.prefersCrossFadeTransitions checks transition preference
UIAccessibility.isDarkerSystemColorsEnabled checks contrast preference
UIFocusGuide directs focus for tvOS and keyboard navigation
UIFocusSystem.focusSystem(for:) accesses focus system
UIFocusDebugger for debugging focus issues

Search

UISearchController manages search interface
searchResultsController displays search results
searchBar is the embedded UISearchBar
isActive indicates search mode
obscuresBackgroundDuringPresentation dims background
hidesNavigationBarDuringPresentation hides nav bar
automaticallyShowsCancelButton, automaticallyShowsScopeBar
UISearchResultsUpdating protocol for search updates
updateSearchResults(for:) called as text changes
UISearchControllerDelegate for state change notifications
willPresentSearchController(_:), didPresentSearchController(_:)
UISearchBar provides search input UI
text, placeholder, prompt
showsCancelButton, showsBookmarkButton, showsSearchResultsButton
scopeButtonTitles, selectedScopeButtonIndex
searchBarStyle: .default, .prominent, .minimal
barTintColor, searchTextField
UISearchBarDelegate handles search events
searchBar(_:textDidChange:) fires during typing
searchBarSearchButtonClicked(_:) fires on search
searchBarCancelButtonClicked(_:) fires on cancel
UISearchToken represents tokenized search terms
UISearchSuggestion protocol for search suggestions
UISearchTextField is the text field within search bar
tokens array manages search tokens
insertToken(_:at:), removeToken(at:)

Toolbars & Tab Bars

UIToolbar displays action buttons at bottom
items is array of UIBarButtonItem
setItems(_:animated:) updates items
barStyle: .default, .black
isTranslucent, barTintColor, tintColor
UIToolbarAppearance for declarative styling
UIBarButtonItem represents toolbar/navigation button
init(barButtonSystemItem:target:action:) for system items
.done, .cancel, .edit, .save, .add, .search, .action
init(title:style:target:action:) for text items
init(image:style:target:action:) for image items
init(customView:) for custom views
UIBarButtonItem.Style: .plain, .done
isEnabled, tintColor, width
UIBarButtonItemGroup groups items with optional representative item
UINavigationBar displays navigation title and buttons
items is stack of UINavigationItem
pushItem(_:animated:), popItem(animated:)
topItem, backItem
prefersLargeTitles enables large titles
standardAppearance, compactAppearance, scrollEdgeAppearance
UINavigationBarAppearance configures bar appearance
configureWithDefaultBackground(), configureWithOpaqueBackground(), configureWithTransparentBackground()
backgroundColor, backgroundImage, shadowColor, shadowImage
titleTextAttributes, largeTitleTextAttributes
buttonAppearance, doneButtonAppearance, backButtonAppearance
UITabBar displays tab selection
items is array of UITabBarItem
selectedItem current selection
barStyle, isTranslucent, barTintColor
UITabBarAppearance for declarative styling
stackedLayoutAppearance, inlineLayoutAppearance, compactInlineLayoutAppearance
UITabBarItemAppearance configures item appearance
UITabBarItem represents individual tab
init(title:image:tag:), init(title:image:selectedImage:)
init(tabBarSystemItem:tag:) for system items
badgeValue displays badge
badgeColor, setBadgeTextAttributes(_:for:)

Haptics

UIImpactFeedbackGenerator produces impact feedback
init(style:): .light, .medium, .heavy, .soft, .rigid
impactOccurred() triggers feedback
impactOccurred(intensity:) with variable intensity
UISelectionFeedbackGenerator produces selection feedback
selectionChanged() triggers tick feedback
UINotificationFeedbackGenerator produces notification feedback
notificationOccurred(_:): .success, .warning, .error
prepare() warms up the taptic engine for all generators
UICanvasFeedbackGenerator for drawing-related haptics (iOS 17.5+)
CHHapticEngine for custom haptic patterns (Core Haptics)

Printing

UIPrintInteractionController presents print dialog
shared singleton instance
printInfo configures print job
printingItem, printingItems data to print
printFormatter, printPageRenderer for custom rendering
present(animated:completionHandler:) shows print UI
present(from:animated:completionHandler:) for iPad popover
UIPrintInfo configures print settings
outputType: .general, .photo, .grayscale
orientation: .portrait, .landscape
jobName, printerID
UIPrintFormatter formats content for printing
UISimpleTextPrintFormatter, UIMarkupTextPrintFormatter, UIViewPrintFormatter
startPage, pageCount
UIPrintPageRenderer custom page rendering
numberOfPages, prepareForDrawingPages(in:)
drawPage(at:in:) draws page content
addPrintFormatter(_:startingAtPageAt:)

App Extensions

UIApplication.shared.open(_:options:completionHandler:) opens URLs
UIApplication.OpenExternalURLOptionsKey options dictionary keys
extensionContext for app extension communication
NSExtensionContext manages extension lifecycle
inputItems provides input from host app
completeRequest(returningItems:completionHandler:) returns results
cancelRequest(withError:) cancels extension
UIDocumentInteractionController opens documents in other apps
url points to document
presentOpenInMenu(from:animated:) shows sharing menu
presentPreview(animated:) shows preview
UIDocumentInteractionControllerDelegate handles events
UIActivityViewController shares content
init(activityItems:applicationActivities:)
excludedActivityTypes removes unwanted activities
completionWithItemsHandler for completion callback
UIActivity base class for custom activities
UIActivityType identifies system activities

Background Tasks

UIApplication.shared.beginBackgroundTask(withName:expirationHandler:)
UIApplication.shared.endBackgroundTask(_:)
backgroundTimeRemaining shows remaining time
BGTaskScheduler schedules background work (BackgroundTasks framework)
register(forTaskWithIdentifier:using:launchHandler:)
submit(_:) schedules task request
BGAppRefreshTaskRequest for app refresh
BGProcessingTaskRequest for lengthy processing
requiresNetworkConnectivity, requiresExternalPower
Background fetch: setMinimumBackgroundFetchInterval(_:)
Background URL session: URLSessionConfiguration.background(withIdentifier:)
Silent push notifications trigger background work
Location services can wake app for significant changes

State Restoration

UIStateRestoring protocol for custom restoration
restorationIdentifier on view controllers enables restoration
encodeRestorableState(with:) saves state
decodeRestorableState(with:) restores state
applicationFinishedRestoringState() called after restoration completes
UIViewControllerRestoration provides custom restoration class
restorationClass property specifies restoration handler
viewController(withRestorationIdentifierPath:coder:) recreates controllers
UIStateRestorationViewControllerProtocolVersionNumber version check
Scene-based restoration via NSUserActivity
scene(_:willConnectTo:options:) receives user activity
stateRestorationActivity(for:) returns activity to save

Notifications & Observers

NotificationCenter.default.addObserver(_:selector:name:object:)
NotificationCenter.default.addObserver(forName:object:queue:using:) closure variant
NotificationCenter.default.post(name:object:userInfo:)
NotificationCenter.default.removeObserver(_:)
Key UIKit notifications:
UIApplication.didBecomeActiveNotification
UIApplication.willResignActiveNotification
UIApplication.didEnterBackgroundNotification
UIApplication.willEnterForegroundNotification
UIApplication.willTerminateNotification
UIApplication.didReceiveMemoryWarningNotification
UIResponder.keyboardWillShowNotification, .keyboardDidShowNotification
UIResponder.keyboardWillHideNotification, .keyboardDidHideNotification
UIResponder.keyboardWillChangeFrameNotification
UIContentSizeCategory.didChangeNotification
UIAccessibility.voiceOverStatusDidChangeNotification
UIScene.willConnectNotification, .didActivateNotification
Keyboard notification userInfo keys:
UIResponder.keyboardFrameBeginUserInfoKey
UIResponder.keyboardFrameEndUserInfoKey
UIResponder.keyboardAnimationDurationUserInfoKey
UIResponder.keyboardAnimationCurveUserInfoKey
KVO: observe(_:options:changeHandler:) for property observation

Testing

accessibilityIdentifier enables element lookup in UI tests
XCUIApplication launches and queries app
XCUIElement represents UI element
exists, isHittable, isEnabled, isSelected
tap(), doubleTap(), press(forDuration:)
swipeUp(), swipeDown(), swipeLeft(), swipeRight()
typeText(_:) enters text
XCUIElementQuery finds elements
buttons, labels, textFields, staticTexts
element(boundBy:), element(matching:identifier:)
XCTAssert family for assertions
Snapshot testing for visual regression
Performance testing with measure(_:)

SwiftUI Interoperability

UIHostingController hosts SwiftUI views in UIKit
init(rootView:) wraps SwiftUI view
rootView property accesses/updates the SwiftUI view
sizingOptions controls hosting controller sizing
UIViewRepresentable wraps UIKit views for SwiftUI
makeUIView(context:) creates the UIKit view
updateUIView(_:context:) updates from SwiftUI state
dismantleUIView(_:coordinator:) cleanup
makeCoordinator() creates delegate/data source coordinator
Coordinator class handles delegate callbacks
UIViewControllerRepresentable wraps view controllers
makeUIViewController(context:) creates controller
updateUIViewController(_:context:) updates controller
@UIApplicationDelegateAdaptor bridges UIKit app delegate
@Environment(\.dismiss) works with UIKit presentation