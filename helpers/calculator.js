const calculateProjectFee = (totalSq) => {
  if (totalSq < 15) return 999;
  else if (totalSq < 21) return 1349;
  else if (totalSq < 36) return 1749;
  else if (totalSq < 46) return 2049;
  else if (totalSq < 61) return 2449;
  else if (totalSq < 81) return 3099;
  else return 3599;
};

module.exports = {
  calculateProjectFee,
};
