export function createSession(run, show, fail = () => {}) {
  let revision = 0;
  return {
    invalidate() { revision++; },
    snapshot() { const ticket = revision; return () => ticket === revision; },
    async submit(...args) {
      const ticket = ++revision;
      try {
        const result = await run(...args);
        if (ticket === revision) show(result);
      } catch (error) {
        if (ticket === revision) fail(error);
      }
    },
  };
}
