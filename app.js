
document.addEventListener("DOMContentLoaded", () => {
  let expenses = [];

  async function loadExpenses() {
    const res = await fetch("/api/expenses");
    expenses = await res.json();
    renderExpenses();
    renderSummary();
    renderCharts();
  }

  async function addExpense(e) {
    e.preventDefault();
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const payer = document.getElementById("payer").value;

    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, description, amount, category, payer })
    });

    e.target.reset();
    loadExpenses();
  }

  function renderExpenses() {
    const tbody = document.querySelector("#expenseTable tbody");
    tbody.innerHTML = expenses.map(exp => `
      <tr><td>${exp.date}</td><td>${exp.description}</td><td>${exp.amount.toFixed(2)}</td><td>${exp.category}</td><td>${exp.payer}</td></tr>
    `).join("");
  }

  function renderSummary() {
    let pranav = 0, vaishali = 0;
    expenses.forEach(exp => {
      if (exp.payer === "Pranav") pranav += exp.amount;
      else if (exp.payer === "Vaishali") vaishali += exp.amount;
      else if (exp.payer === "Split") {
        pranav += exp.amount / 2;
        vaishali += exp.amount / 2;
      }
    });
    const summary = document.getElementById("summaryText");
    summary.innerHTML = `
      <p><strong>Pranav:</strong> ฿${pranav.toFixed(2)}</p>
      <p><strong>Vaishali:</strong> ฿${vaishali.toFixed(2)}</p>
      <p><strong>Total:</strong> ฿${(pranav + vaishali).toFixed(2)}</p>
      <p><strong>Balance:</strong> ${pranav > vaishali ? `Vaishali owes Pranav ฿${((pranav - vaishali)/2).toFixed(2)}` : `Pranav owes Vaishali ฿${((vaishali - pranav)/2).toFixed(2)}`}</p>
    `;
  }

  function renderCharts() {
    const categoryData = {};
    const contributionData = { Pranav: 0, Vaishali: 0 };
    expenses.forEach(exp => {
      categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
      if (exp.payer === "Split") {
        contributionData.Pranav += exp.amount / 2;
        contributionData.Vaishali += exp.amount / 2;
      } else {
        contributionData[exp.payer] += exp.amount;
      }
    });

    if (window.categoryChart) window.categoryChart.destroy?.();
    if (window.contributionChart) window.contributionChart.destroy?.();

    const catCtx = document.getElementById("categoryChart").getContext("2d");
    const conCtx = document.getElementById("contributionChart").getContext("2d");

    window.categoryChart = new Chart(catCtx, {
      type: "pie",
      data: { labels: Object.keys(categoryData), datasets: [{ data: Object.values(categoryData), backgroundColor: ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"] }] },
      options: { plugins: { title: { display: true, text: "Spending by Category" } } }
    });

    window.contributionChart = new Chart(conCtx, {
      type: "bar",
      data: { labels: Object.keys(contributionData), datasets: [{ label: "Contribution (THB)", data: Object.values(contributionData), backgroundColor: ["#3b82f6", "#ec4899"] }] },
      options: { plugins: { title: { display: true, text: "Individual Contributions" } }, scales: { y: { beginAtZero: true } } }
    });
  }

  document.getElementById("expenseForm").addEventListener("submit", addExpense);
  loadExpenses();
});
