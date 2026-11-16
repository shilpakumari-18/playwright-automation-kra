export function calculateLineTotal(
  unitPrice,
  quantity
) {

return Number(
    (unitPrice * quantity).toFixed(2)
  );
}

export function calculateBillTotals({
  itemTotalMRP,
  handlingCharges,
  totalDiscount
}) {
  return Number(
    (
      itemTotalMRP +
      handlingCharges +
      totalDiscount
    ).toFixed(2)
  );
}

export function calculateExtraAmount(toBePaid, calculatedPayable) {
  return Number((toBePaid - calculatedPayable).toFixed(2));
}