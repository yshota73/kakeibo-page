const STORAGE_KEY = "kakeiboEntries";

const form = document.querySelector("#entry-form");
const dateInput = document.querySelector("#entry-date");
const itemInput = document.querySelector("#entry-item");
const typeInput = document.querySelector("#entry-type");
const amountInput = document.querySelector("#entry-amount");
const formMessage = document.querySelector("#form-message");
const entryList = document.querySelector("#entry-list");
const totalAmount = document.querySelector("#total-amount");

let entries = [];
let storageReady = false;

function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.date === "string" &&
    typeof value.item === "string" &&
    value.item.trim().length > 0 &&
    (value.type === "income" || value.type === "expense") &&
    Number.isSafeInteger(value.amount) &&
    value.amount >= 0
  );
}

function formatYen(amount) {
  return `${new Intl.NumberFormat("ja-JP").format(amount)}円`;
}

function renderEntries() {
  entryList.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "登録データはありません。";
    row.append(cell);
    entryList.append(row);
  } else {
    for (const entry of entries) {
      const row = document.createElement("tr");
      const values = [
        entry.date,
        entry.item,
        entry.type === "income" ? "収入" : "支出",
        formatYen(entry.amount),
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }

      entryList.append(row);
    }
  }

  const balance = entries.reduce(
    (sum, entry) => sum + (entry.type === "income" ? entry.amount : -entry.amount),
    0,
  );
  totalAmount.textContent = formatYen(balance);
}

function showMessage(message) {
  formMessage.textContent = message;
  formMessage.hidden = false;
}

itemInput.addEventListener("input", () => itemInput.setCustomValidity(""));
amountInput.addEventListener("input", () => amountInput.setCustomValidity(""));

try {
  const storedData = localStorage.getItem(STORAGE_KEY);

  if (storedData !== null) {
    const parsedData = JSON.parse(storedData);
    if (!Array.isArray(parsedData) || !parsedData.every(isEntry)) {
      throw new Error("保存データの形式が正しくありません。");
    }
    entries = parsedData;
  }

  storageReady = true;
  renderEntries();
} catch (error) {
  console.error("家計簿データの読み込みに失敗しました。", error);
  showMessage("保存データを読み込めません。既存データを保護するため、追加を停止しました。");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!storageReady) {
    return;
  }

  const item = itemInput.value.trim();
  if (item.length === 0) {
    itemInput.setCustomValidity("品目を入力してください。");
    itemInput.reportValidity();
    return;
  }
  itemInput.setCustomValidity("");

  const amount = Number(amountInput.value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    amountInput.setCustomValidity("0以上の整数を入力してください。");
    amountInput.reportValidity();
    return;
  }
  amountInput.setCustomValidity("");

  const newEntry = {
    date: dateInput.value,
    item,
    type: typeInput.value,
    amount,
  };
  const updatedEntries = [...entries, newEntry];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error("家計簿データの保存に失敗しました。", error);
    showMessage("保存に失敗しました。入力内容は登録されていません。");
    return;
  }

  entries = updatedEntries;
  renderEntries();
  form.reset();
  formMessage.hidden = true;
  formMessage.textContent = "";
});
