const launchpadElement = document.getElementById("launchpad");
const unipack = document.getElementById("unipack");

unipack.onchange = (e) => {
  const file = unipack.files[0];

  if (file) {
    virtualPad.load(file);
  }
}

const virtualPad = new VirtualLaunchpad(launchpadElement, "rgba(15, 15, 15, 0.95)");

document.addEventListener("keydown", (e) => {
  if (e.code == "Space") {
    virtualPad.reset();
    virtualPad.playAuto();
  } else if (e.code == "ControlLeft") {
    virtualPad.reset();
    virtualPad.playAuto(true);
  }
});