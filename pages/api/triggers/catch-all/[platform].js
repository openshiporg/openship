const handler = async (req, res) => {
  res.status(200).json({ received: true });

  // use catch-all route if platform sends all webhook alerts to 1 url (e.g. TOROD)

  const { platform } = req.query;
  if (!transformer[platform]) {
    return { error: "Catch all parser for platform not found" };
  }

  await transformer[platform](req, res);
};

export default handler;

const transformer = {
};
