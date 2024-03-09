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

let sidebarHidden = false;

document.addEventListener("keydown", (e) => {
  // if (e.code == "Space") {
  //   virtualPad.reset();
  //   virtualPad.playAuto();
  // } else if (e.code == "ControlLeft") {
  //   virtualPad.reset();
  //   virtualPad.playAuto(true);
  // }

  if (e.code == "ControlLeft") {
      const sidebar = document.getElementById("launchpad-sidebar");
      const app = document.getElementById("app");

      if (sidebarHidden) {
        sidebar.style.setProperty("display", "");
        document.querySelector("#hiddenSidebar").remove();
      } else {
        sidebar.style.setProperty("display", "none");

        const style = document.createElement("style");
        style.innerHTML = `#app {
  grid-template-columns: 1fr !important;
        }`.trim();
        style.id = "hiddenSidebar";

        document.head.appendChild(style);
      }

      sidebarHidden = !sidebarHidden;
    }

  // virtualPad.playNext();
});