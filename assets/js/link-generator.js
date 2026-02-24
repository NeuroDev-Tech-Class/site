// Makes course assignment checkboxes pretty and consistent, with password protection for links

const authPassword = "love2code!";
if (localStorage.getItem("isAuthenticated") === null) {
  localStorage.setItem("isAuthenticated", "false");
}

document.addEventListener("DOMContentLoaded", () => {
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  const dataScript = document.getElementById("unit-data");
  if (!dataScript) {
    console.error("No unit data found.");
    return;
  }

  let unitData = [];
  try {
    unitData = JSON.parse(dataScript.textContent);
  } catch (error) {
    console.error("Error parsing JSON data:", error);
    return;
  }

  const container = document.getElementById("unit-sections");

  unitData.forEach((unit) => {
    const section = document.createElement("section");

    // Unit Title and Description
    const header = document.createElement("h2");
    header.textContent = unit.title;

    const description = document.createElement("p");
    description.textContent = unit.description;

    section.appendChild(header);
    section.appendChild(description);

    unit.content.forEach((item) => {
      const div = document.createElement("div");
      const label = document.createElement("label");

      // checkbox logic
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";

      const boxKey = `checked:${unit.title}|${item.title}`;
      const saved = localStorage.getItem(boxKey);
      checkbox.checked = saved === "true";
      checkbox.addEventListener("change", () => {
        localStorage.setItem(boxKey, checkbox.checked);
      });
      label.appendChild(checkbox);

      // YouTube links
      if (item.type === "video") {
        label.appendChild(document.createTextNode(`Video - ${item.title}`));
        div.appendChild(label);
        const videoContainer = document.createElement("div");
        videoContainer.className = "video-responsive";

        const iframe = document.createElement("iframe");
        iframe.src = item.url;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.loading = "lazy";

        videoContainer.appendChild(iframe);
        div.appendChild(videoContainer);
      }

      // Inline HTML content
      else if (item.type === "html") {
        const text = document.createTextNode(item.title || "");
        label.appendChild(text);

        const htmlContainer = document.createElement("span");
        htmlContainer.innerHTML = item.html;
        htmlContainer.style.display = "inline-block";
        label.appendChild(htmlContainer);
        div.appendChild(label);
      }

      // All other link types (with password protection)
      else {
        const link = document.createElement("a");
        link.dataset.url = item.url;
        link.href = isAuth ? item.url : "javascript:void(0)";
        link.textContent = item.title;

        // External links & PDFs open in new tab; internal doc pages navigate
        const isExternal =
          item.url &&
          (item.url.startsWith("http") || item.url.endsWith(".pdf"));
        if (isExternal) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }

        link.addEventListener("click", function (e) {
          e.preventDefault();
          // if not yet logged in:
          if (localStorage.getItem("isAuthenticated") !== "true") {
            const entered = prompt("Please enter the Tech Class password.");
            if (entered === null || entered === "") return; // canceled
            if (entered !== authPassword) {
              alert("Incorrect password.\nHint: Ask the tech coach!");
              return;
            }
            localStorage.setItem("isAuthenticated", "true");
            alert("Access granted!");
            // flip every protected link to point at its real URL
            document.querySelectorAll("a[data-url]").forEach((a) => {
              a.href = a.dataset.url;
            });
          }
          if (isExternal) {
            window.open(this.dataset.url, "_blank");
          } else {
            window.location.href = this.dataset.url;
          }
        });

        label.appendChild(link);
        div.appendChild(label);
      }

      section.appendChild(div);
    });

    container.appendChild(section);
  });
});
