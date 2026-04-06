export async function shareText(text, setStatus) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (_) {
      // user cancelled or failed, fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    if (setStatus) setStatus("copied");
  } catch (_) {
    if (setStatus) setStatus("error");
  }

  if (setStatus) {
    setTimeout(() => setStatus(null), 3000);
  }
}

export function getShareLinks(text) {
  const encoded = encodeURIComponent(text);
  return {
    x: `https://x.com/intent/tweet?text=${encoded}`,
    line: `https://social-plugins.line.me/lineit/share?url=&text=${encoded}`,
  };
}
