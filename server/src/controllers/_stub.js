// =====================================================
// Small helper that returns a 501 "coming soon" handler.
// Used by modules scheduled for later milestones (M3/M4).
// =====================================================

export function ok(moduleName, status = 501) {
  return (_req, res) =>
    res.status(status).json({
      error: `${moduleName} endpoint is not implemented yet — planned in a future milestone.`,
    });
}