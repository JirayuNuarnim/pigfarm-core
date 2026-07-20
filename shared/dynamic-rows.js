function addRow(tableBodyId) {
  const tbody = document.getElementById(tableBodyId);
  const template = tbody.querySelector(".row-template");
  const clone = template.cloneNode(true);
  clone.classList.remove("row-template");
  clone.style.display = "";
  clone.querySelectorAll("input").forEach((el) => (el.value = ""));
  const amt = clone.querySelector(".f-amount");
  if (amt) amt.textContent = "0.00";
  tbody.appendChild(clone);
}

function removeRow(btn) {
  const row = btn.closest("tr");
  const tbody = row.parentElement;
  const realRows = [...tbody.children].filter(
    (r) => !r.classList.contains("row-template")
  );
  if (realRows.length > 1) {
    row.remove();
  } else {
    row.querySelectorAll("input").forEach((el) => (el.value = ""));
  }
  const table = tbody.closest("table");
  if (table) recalcGrandTotal(table);
}

function recalcRow(row) {
  const qtyEl = row.querySelector(".f-qty");
  const priceEl = row.querySelector(".f-price");
  const amountEl = row.querySelector(".f-amount");
  if (!amountEl) return;
  const qty = parseFloat(qtyEl ? qtyEl.value : 1) || 0;
  const price = parseFloat(priceEl ? priceEl.value : 0) || 0;
  amountEl.textContent = (qty * price).toFixed(2);
}

function recalcGrandTotal(table) {
  let sum = 0;
  table.querySelectorAll("tbody tr:not(.row-template) .f-amount").forEach((el) => {
    sum += parseFloat(el.textContent) || 0;
  });
  const totalEl = document.querySelector('[data-grand-total-for="' + table.id + '"]');
  if (totalEl) totalEl.textContent = sum.toFixed(2);
}

document.addEventListener("input", function (e) {
  if (e.target.matches(".calc-row .f-qty, .calc-row .f-price")) {
    const row = e.target.closest("tr");
    recalcRow(row);
    const table = e.target.closest("table");
    if (table) recalcGrandTotal(table);
  }
});
