let db;
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
      sendData();
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

function sendData() {
    // open a transaction on your pending db
    const transaction = db.transaction(['new_entry'], 'readWrite');
  
    // access your pending object store
    const entryObjectStore = transaction.objectStore('new_entry');
  
    // get all records from store and set to a variable
    const getAll = entryObjectStore.getAll();
  
    getAll.onSuccess = function() {
      // if there was data in indexedDb's store, let's send it to the api server
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
            // clear all items in your store
            entryObjectStore.clear();
          })
          .catch(err => {
            console.log(err);
          });
      }
    };
}
  
  // listen for app coming back online
  window.addEventListener('online', sendData);