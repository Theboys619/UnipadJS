const launchpadElement = document.getElementById("launchpad");
const unipack = document.getElementById("unipack");

const theme = document.querySelector("#theme");

unipack.onchange = (e) => {
  const file = unipack.files[0];

  if (file) {
    virtualPad.load(file);
  }
}

const virtualPad = new VirtualLaunchpad(launchpadElement, { theme: "colorful" });

theme.addEventListener("change", (e) => {
  virtualPad.theme = theme.value ?? "colorful";
  virtualPad.loadTheme();
});

document.addEventListener("keydown", (e) => {
  if (e.code == "Space") {
    virtualPad.reset();
    virtualPad.playAuto();
  } else if (e.code == "ControlLeft") {
    virtualPad.reset();
    virtualPad.playAuto(true);
  }
});