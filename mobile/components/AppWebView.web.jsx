export default function AppWebView({
  source,
  style,
  title = "Web content",
  allowsFullscreenVideo,
  mediaPlaybackRequiresUserAction,
  ...rest
}) {
  const uri = source?.uri;
  if (!uri) return null;

  return (
    <iframe
      src={uri}
      title={title}
      style={{
        border: 0,
        width: "100%",
        height: "100%",
        ...(style || {}),
      }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      {...rest}
    />
  );
}
