htmx.defineExtension("class-swap", {
  handleSwap: function (swapStyle, target, fragment) {
    if (swapStyle === "class") {
      for (const className of fragment.classList) {
        if (className.startsWith("-")) {
          target.classList.remove(className.slice(1));
        } else {
          target.classList.add(className);
        }
      }
      return target;
    }
  },
});
