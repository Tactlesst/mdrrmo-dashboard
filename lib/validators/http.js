export function zodErrorToResponse(error) {
  const issues = error?.issues || [];
  return {
    success: false,
    message: 'Validation failed',
    issues: issues.map((i) => ({
      path: Array.isArray(i.path) ? i.path.join('.') : String(i.path || ''),
      message: i.message,
      code: i.code,
    })),
  };
}
