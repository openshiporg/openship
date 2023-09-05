export const removeEmpty = (obj) => {
  Object.keys(obj).forEach(
    (k) => !obj[k] && obj[k] !== undefined && delete obj[k]
  );
  return obj;
};
