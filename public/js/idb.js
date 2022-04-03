// Used https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB, and https://www.w3schools.com/html/html5_webworkers.asp for help figuring this one out

let db;
// Below makes a new db  request for our budget database
const request = indexedDB.open('budget-tracker', 1);

request.onUpgradeNeeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_entry', { autoIncrement: true });
};

// This function will check to see if the db is created with an object store, then save the reference in the global variable
// Then if the app if online it'll send all local data to api
request.onSuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
      checkData();
    }
};
  
request.onError = function(event) {
    console.log(event.target.errorCode);
};

// Makes a transaction on db with readWrite
function saveRecord(record) {
    const transaction = db.transaction(['new_entry'], 'readWrite');
    const entryObjectStore = transaction.objectStore('new_entry');
    entryObjectStore.add(record);
}


function checkData() {
    const transaction = db.transaction(['new_entry'], 'readWrite');
    const entryObjectStore = transaction.objectStore('new_entry');
    const getAll = entryObjectStore.getAll();
  
    getAll.onSuccess = function() {
      if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
          method: 'POST',
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        })
          .then(response => response.json())
          .then(serverResponse => {
            if (serverResponse.message) {
              throw new Error(serverResponse);
            }
  
            const transaction = db.transaction(['new_entry'], 'readWrite');
            const entryObjectStore = transaction.objectStore('new_entry');
            entryObjectStore.clear();
          })
          .catch(err => {
            console.log(err);
          });
      }
    };
}
  
  // Big one here, checks for app to come back online
  window.addEventListener('online', checkData);