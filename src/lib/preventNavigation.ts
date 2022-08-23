export function preventNavigation(node: HTMLElement) {

  const message = "Are you sure you want to reset the scores?";

  const checkNavigation = (e: BeforeUnloadEvent) => {

    e.preventDefault();
    return e.returnValue = message;
 
  }

  window.addEventListener("beforeunload", checkNavigation);

  return {
    destroy() {
      window.removeEventListener("beforeunload", checkNavigation);
    },
  };
}
