const tabs = [...document.querySelectorAll(".step")];
const panels = [...document.querySelectorAll(".phone-panel")];
const availableTabs = tabs.filter((tab) => panels.some((panel) => panel.dataset.panel === tab.dataset.tab));

function selectTab(tab) {
  const targetPanel = panels.find((panel) => panel.dataset.panel === tab.dataset.tab);
  if (!targetPanel) return;

  const selectedIndex = tabs.indexOf(tab);
  tabs.forEach((item, index) => {
    const active = item === tab;
    item.classList.toggle("active", active);
    item.classList.toggle("completed", index < selectedIndex);
    item.setAttribute("aria-selected", String(active));
  });

  panels.forEach((panel) => {
    const active = panel === targetPanel;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  document.querySelector(".preview-area").setAttribute("aria-label", `${tab.dataset.tab}预览`);
  editSheet.dataset.mode = tab.dataset.tab === "头图"
    ? "head"
    : tab.dataset.tab === "相册"
      ? "album"
      : tab.dataset.tab === "推荐菜"
        ? "recommend"
        : "external";
  document.querySelector(".edit-title").textContent = tab.dataset.tab === "相册"
    ? "门店相册"
    : tab.dataset.tab === "推荐菜"
      ? "推荐菜"
      : "门店头图";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab));
});

let swipeStartX = null;
const preview = document.querySelector(".preview-area");

preview.addEventListener("pointerdown", (event) => {
  swipeStartX = event.clientX;
});

preview.addEventListener("dragstart", (event) => event.preventDefault());

preview.addEventListener("pointerup", (event) => {
  if (swipeStartX === null) return;
  const distance = event.clientX - swipeStartX;
  swipeStartX = null;
  if (Math.abs(distance) < 36) return;

  const current = availableTabs.findIndex((tab) => tab.classList.contains("active"));
  const next = distance < 0 ? current + 1 : current - 1;
  if (availableTabs[next]) selectTab(availableTabs[next]);
});

preview.addEventListener("pointercancel", () => {
  swipeStartX = null;
});

const device = document.querySelector(".device");
const editSheet = document.querySelector(".edit-sheet");
const editButton = document.querySelector(".edit-button");
const editCancel = document.querySelector(".edit-cancel");
const editConfirm = document.querySelector(".edit-confirm");
const editThumbs = [...document.querySelectorAll(".edit-thumb")];
const headEditThumbs = [...document.querySelectorAll(".head-edit-thumb")];
const albumEditThumbs = [...document.querySelectorAll(".album-edit-thumb")];
const recommendEditThumbs = [...document.querySelectorAll(".recommend-edit-thumb")];
const albumGrid = document.querySelector(".album-grid");
const albumItems = [...document.querySelectorAll(".album-item")];
const dishRow = document.querySelector(".dish-row");
const dishCards = [...document.querySelectorAll(".dish-card")];
const shopCover = document.querySelector(".shop-cover");
const heroCover = document.querySelector(".hero-banner > img");
let albumSelection = albumEditThumbs.map((thumb) => thumb.dataset.albumId);
let dishSelection = recommendEditThumbs.map((thumb) => thumb.dataset.dishId);
let editSnapshot = null;

function selectImage(thumb, thumbGroup, previewImage) {
  thumbGroup.forEach((item) => {
    const selected = item === thumb;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", String(selected));
    item.querySelector(".edit-check, .head-edit-check").src = selected
      ? "./assets/edit-checkbox-selected.svg"
      : "./assets/edit-checkbox-empty.svg";
  });

  previewImage.src = thumb.dataset.preview;
}

function selectCover(thumb) {
  selectImage(thumb, editThumbs, shopCover);
}

function selectHeadCover(thumb) {
  selectImage(thumb, headEditThumbs, heroCover);
}

function renderAlbumSelection() {
  albumEditThumbs.forEach((thumb) => {
    const order = albumSelection.indexOf(thumb.dataset.albumId);
    const selected = order !== -1;
    thumb.classList.toggle("selected", selected);
    thumb.setAttribute("aria-pressed", String(selected));
    thumb.querySelector(".album-edit-index").textContent = selected ? String(order + 1) : "";
    thumb.setAttribute(
      "aria-label",
      selected
        ? `相册图片 ${thumb.dataset.albumId}，已选第 ${order + 1} 张`
        : `选择相册图片 ${thumb.dataset.albumId}`,
    );
  });

  albumSelection.forEach((id) => {
    const item = albumItems.find((candidate) => candidate.dataset.albumId === id);
    if (item) {
      item.hidden = false;
      albumGrid.appendChild(item);
    }
  });
  albumItems.forEach((item) => {
    if (!albumSelection.includes(item.dataset.albumId)) item.hidden = true;
  });

  [...albumGrid.querySelectorAll(".album-item:not([hidden])")].forEach((item, index) => {
    const handle = item.querySelector(".drag-badge");
    if (!handle) return;
    handle.setAttribute("role", "button");
    handle.setAttribute("tabindex", "0");
    handle.setAttribute("aria-label", `拖动调整第 ${index + 1} 张图片的顺序`);
  });
}

function toggleAlbumImage(thumb) {
  const id = thumb.dataset.albumId;
  const currentIndex = albumSelection.indexOf(id);
  if (currentIndex === -1) albumSelection.push(id);
  else if (albumSelection.length > 1) albumSelection.splice(currentIndex, 1);
  renderAlbumSelection();
}

function renderDishSelection() {
  recommendEditThumbs.forEach((thumb) => {
    const order = dishSelection.indexOf(thumb.dataset.dishId);
    const selected = order !== -1;
    const name = thumb.querySelector(".recommend-edit-name").textContent;
    thumb.classList.toggle("selected", selected);
    thumb.setAttribute("aria-pressed", String(selected));
    thumb.querySelector(".recommend-edit-index").textContent = selected ? String(order + 1) : "";
    thumb.setAttribute(
      "aria-label",
      selected ? `${name}，已选第 ${order + 1} 道` : `选择${name}`,
    );
  });

  dishSelection.forEach((id) => {
    const card = dishCards.find((candidate) => candidate.dataset.dishId === id);
    if (card) {
      card.hidden = false;
      dishRow.appendChild(card);
    }
  });
  dishCards.forEach((card) => {
    if (!dishSelection.includes(card.dataset.dishId)) card.hidden = true;
  });
}

function toggleDish(thumb) {
  const id = thumb.dataset.dishId;
  const currentIndex = dishSelection.indexOf(id);
  if (currentIndex === -1) dishSelection.push(id);
  else if (dishSelection.length > 1) dishSelection.splice(currentIndex, 1);
  renderDishSelection();
}

function syncAlbumOrderFromPreview() {
  albumSelection = [...albumGrid.querySelectorAll(".album-item:not([hidden])")]
    .map((item) => item.dataset.albumId);
  renderAlbumSelection();
}

function moveAlbumItem(item, direction) {
  const visibleItems = [...albumGrid.querySelectorAll(".album-item:not([hidden])")];
  const currentIndex = visibleItems.indexOf(item);
  const nextIndex = currentIndex + direction;
  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= visibleItems.length) return;

  if (direction < 0) albumGrid.insertBefore(item, visibleItems[nextIndex]);
  else albumGrid.insertBefore(visibleItems[nextIndex], item);
  syncAlbumOrderFromPreview();
}

let activeAlbumSorting = null;

function finishAlbumSorting(event) {
  if (!activeAlbumSorting) return;
  const { item, handle, pointerId } = activeAlbumSorting;
  event?.preventDefault();
  item.classList.remove("sorting");
  if (pointerId !== null && handle.hasPointerCapture(pointerId)) {
    handle.releasePointerCapture(pointerId);
  }
  activeAlbumSorting = null;
  syncAlbumOrderFromPreview();
}

function updateAlbumSorting(item, clientX, clientY) {
  const visibleItems = [...albumGrid.querySelectorAll(".album-item:not([hidden])")];
  const siblings = visibleItems.filter((candidate) => candidate !== item);
  if (!siblings.length) return;

  const gridRect = albumGrid.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const styles = getComputedStyle(albumGrid);
  const columnGap = Number.parseFloat(styles.columnGap) || 0;
  const rowGap = Number.parseFloat(styles.rowGap) || 0;
  const contentLeft = gridRect.left + (Number.parseFloat(styles.paddingLeft) || 0);
  const contentTop = gridRect.top + (Number.parseFloat(styles.paddingTop) || 0);
  const column = Math.max(0, Math.min(1, Math.floor((clientX - contentLeft) / (itemRect.width + columnGap))));
  const row = Math.max(0, Math.floor((clientY - contentTop) / (itemRect.height + rowGap)));
  const targetIndex = Math.min(row * 2 + column, siblings.length);

  if (targetIndex === siblings.length) albumGrid.appendChild(item);
  else albumGrid.insertBefore(item, siblings[targetIndex]);
}

albumItems.forEach((item) => {
  const handle = item.querySelector(".drag-badge");
  if (!handle) return;

  handle.addEventListener("pointerdown", (event) => {
    if (device.classList.contains("editing")) return;
    event.preventDefault();
    event.stopPropagation();
    item.classList.add("sorting");
    handle.setPointerCapture(event.pointerId);
    activeAlbumSorting = { item, handle, pointerId: event.pointerId };
  });

  handle.addEventListener("pointermove", (event) => {
    if (!item.classList.contains("sorting")) return;
    event.preventDefault();
    event.stopPropagation();
    updateAlbumSorting(item, event.clientX, event.clientY);
  });

  handle.addEventListener("pointerup", (event) => {
    event.stopPropagation();
    finishAlbumSorting(event);
  });
  handle.addEventListener("pointercancel", finishAlbumSorting);
  handle.addEventListener("keydown", (event) => {
    if (device.classList.contains("editing")) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveAlbumItem(item, -1);
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveAlbumItem(item, 1);
    }
  });
});

window.addEventListener("pointerup", finishAlbumSorting);
window.addEventListener("pointercancel", finishAlbumSorting);
window.addEventListener("mouseup", finishAlbumSorting);
window.addEventListener("pointermove", (event) => {
  if (!activeAlbumSorting) return;
  updateAlbumSorting(activeAlbumSorting.item, event.clientX, event.clientY);
});

function setEditing(editing) {
  if (editing) {
    const mode = editSheet.dataset.mode;
    if (mode === "album") {
      editSnapshot = { mode, albumSelection: [...albumSelection] };
      renderAlbumSelection();
    } else if (mode === "recommend") {
      editSnapshot = { mode, dishSelection: [...dishSelection] };
      renderDishSelection();
    } else {
      const headMode = mode === "head";
    editSnapshot = {
      mode: headMode ? "head" : "external",
      thumb: (headMode ? headEditThumbs : editThumbs).find((thumb) => thumb.classList.contains("selected")),
      preview: (headMode ? heroCover : shopCover).getAttribute("src"),
    };
    }
  }
  device.classList.toggle("editing", editing);
  editSheet.setAttribute("aria-hidden", String(!editing));
}

editButton.addEventListener("click", () => setEditing(true));
editCancel.addEventListener("click", () => {
  if (editSnapshot?.mode === "album") {
    albumSelection = [...editSnapshot.albumSelection];
    renderAlbumSelection();
  }
  if (editSnapshot?.mode === "recommend") {
    dishSelection = [...editSnapshot.dishSelection];
    renderDishSelection();
  }
  if (editSnapshot?.thumb) {
    if (editSnapshot.mode === "head") selectHeadCover(editSnapshot.thumb);
    else selectCover(editSnapshot.thumb);
  }
  if (editSnapshot?.preview) {
    if (editSnapshot.mode === "head") heroCover.src = editSnapshot.preview;
    else shopCover.src = editSnapshot.preview;
  }
  setEditing(false);
});
editConfirm.addEventListener("click", () => setEditing(false));

editThumbs.forEach((thumb) => thumb.addEventListener("click", () => selectCover(thumb)));
headEditThumbs.forEach((thumb) => thumb.addEventListener("click", () => selectHeadCover(thumb)));
albumEditThumbs.forEach((thumb) => thumb.addEventListener("click", () => toggleAlbumImage(thumb)));
recommendEditThumbs.forEach((thumb) => thumb.addEventListener("click", () => toggleDish(thumb)));

editSheet.dataset.mode = "external";
renderAlbumSelection();
renderDishSelection();
