const formatIndian = (value) => {
  if (value === null || value === undefined || value === '') return '0';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('en-IN');
};

export default formatIndian;
