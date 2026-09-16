export function openAndFocus(
  url: string,
  name: string,
  existing?: Window | null,
) {
  const mobile =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  const features = mobile ? "" : "popup=yes,width=480,height=760";
  let win = existing && !existing.closed ? existing : null;
  if (win) {
    try {
      if (win.location.href !== url) win.location.assign(url);
      win.focus();
      return win;
    } catch {
      win = null;
    }
  }
  win = features
    ? window.open(url, name, features)
    : window.open(url, name);
  try {
    win?.focus();
  } catch {
    /* Safari a veces ignora focus en pestañas nuevas */
  }
  return win;
}
