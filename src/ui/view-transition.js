function reportTransitionFailures(transition, documentRef, reportError) {
  let failureReported = false;
  const reportFailure = (error) => {
    if (error.name === "AbortError") return;
    if (error.name === "InvalidStateError" && documentRef.visibilityState !== "visible") return;
    if (failureReported) return;
    failureReported = true;
    reportError("[أثير] The page transition did not finish.", error);
  };
  transition.ready.catch(reportFailure);
  transition.updateCallbackDone.catch(reportFailure);
  transition.finished.catch(reportFailure);
}

export function runViewTransition(update, { documentRef, reducedMotion, reportError }) {
  if (reducedMotion || documentRef.visibilityState !== "visible" || typeof documentRef.startViewTransition !== "function") {
    return false;
  }

  let transition;
  try {
    transition = documentRef.startViewTransition(update);
  } catch (error) {
    if (error.name !== "InvalidStateError" || documentRef.visibilityState === "visible") {
      reportError("[أثير] Could not start the page transition; updating the view without animation.", error);
    }
    return false;
  }

  reportTransitionFailures(transition, documentRef, reportError);
  return true;
}
