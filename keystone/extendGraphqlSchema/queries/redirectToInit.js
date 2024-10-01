async function redirectToInit(root, { ids }, context) {
  // 1. Query the current user see if they are signed in
  const userCount = await context.sudo().query.User.count({});

  if (userCount === 0) {
    return true;
  }
  return false;
}

export default redirectToInit;
