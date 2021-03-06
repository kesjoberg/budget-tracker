
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("transaction", { autoIncrement: true });
};


request.onsuccess = ({ target }) => {
  db = target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};


request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

// This function is called when it's time to save data to the indexedDb
function saveRecord(record) {
  // console.log(record)
  // console.log(db)
  const transaction = db.transaction(["transaction"], "readwrite");
  const store = transaction.objectStore("transaction");
  store.add(record);
}

// This function runs when we detect that the internet connection is working again. It sends a post request to the server with all the saved data so that the data can be synced with the server, and then it wipes out the existing indexedDb. You can keep as-is, unless you want to change the name of the fetch route.
function checkDatabase() {
  const transaction = db.transaction(["transaction"], "readwrite");
  console.log(transaction)
  const store = transaction.objectStore("transaction");
  console.log(store)
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then(() => {
        // delete records if successful
        const transaction = db.transaction(["transaction"], "readwrite");
        const store = transaction.objectStore("transaction");
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);