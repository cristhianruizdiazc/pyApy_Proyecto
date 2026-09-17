export async function synchronize(queue, send, save) {
  const next = queue.map((item) => ({
    ...item,
    status: item.status === "syncing" ? "pending" : item.status,
  }));
  for (const item of next) {
    if (item.status !== "pending") continue;
    item.status = "syncing";
    await save([...next]);
    try {
      item.result = await send(item);
      item.status = "synced";
      delete item.error;
    } catch (error) {
      item.error = error.message;
      item.status =
        error.status === 409
          ? "conflict"
          : !error.status ||
              error.status >= 500 ||
              error.status === 401 ||
              error.status === 429
            ? "pending"
            : "failed";
      if (item.status === "pending") {
        await save([...next]);
        break;
      }
    }
    await save([...next]);
  }
  return next;
}
