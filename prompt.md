Refactor this JavaScript project to use a clean ES Modules architecture with explicit initialization instead of side-effect imports.



### Goals



* Eliminate side-effect imports where modules execute logic simply by being imported.

* Each module should expose a clear public API using `export`.

* Keep helper functions private unless they are needed by another module.

* Create a single application entry point (`main.js`) that initializes the entire application.

* Preserve all existing functionality and UI behavior.



### Requirements



#### 1. Convert modules to explicit exports



For each file:



* Export only functions that are intended to be used by other modules.

* Keep internal helper functions unexported.



Example:



```js

export function initEmployeeTable() {}



export function renderEmployeeTable() {}



export function refreshEmployeeTable() {}



function buildEmployeeRow() {}

```



Do not export helper functions unless another module requires them.



---



#### 2. Add initialization functions



Every component should expose one initialization function.



Examples:



```js

export function initLogin() {}

export function initEmployeeTable() {}

export function initProfilePanel() {}

export function initDepartments() {}

export function initDocuments() {}

export function initSettings() {}

export function initBackup() {}

export function initExport() {}

```



Each init function should:



* Register event listeners

* Populate initial UI

* Perform initial rendering

* Initialize component state



---



#### 3. Refactor stores



Store modules should no longer execute logic automatically when imported.



Instead:



```js

export function initUsers() {}

export function initEmployees() {}

export function initDepartments() {}

export function initBackups() {}

```



Other store functions should also be exported as needed, for example:



```js

export function getAllEmployees() {}

export function addEmployee() {}

export function updateEmployee() {}

export function deleteEmployee() {}

```



---



#### 4. Refactor utilities



Utility modules should only export reusable functions.



Example:



```js

export function getEl() {}

export function showToast() {}

export function formatDate() {}

```



Utilities should never execute initialization code.



---



#### 5. Create a single application entry point



Create or refactor `main.js` so it becomes the application's bootstrap.



Example structure:



```js

import { initUsers } from "./js/store/users.js";

import { initEmployees } from "./js/store/employees.js";

import { initDepartments } from "./js/store/departments.js";

import { initBackups } from "./js/store/backups.js";



import { initLogin } from "./js/components/login.js";

import { initEmployeeTable } from "./js/components/employeeTable.js";

import { initEmployeeModal } from "./js/components/employeeModal.js";

import { initProfilePanel } from "./js/components/profilePanel.js";

import { initDocuments } from "./js/components/documents.js";

import { initScanModal } from "./js/components/scanModal.js";

import { initDepartments as initDepartmentComponent } from "./js/components/departments.js";

import { initBackup } from "./js/components/backup.js";

import { initSettings } from "./js/components/settings.js";

import { initExport } from "./js/components/export.js";



document.addEventListener("DOMContentLoaded", () => {

    initUsers();

    initEmployees();

    initDepartments();

    initBackups();



    initLogin();

    initEmployeeTable();

    initEmployeeModal();

    initProfilePanel();

    initDocuments();

    initScanModal();

    initDepartmentComponent();

    initBackup();

    initSettings();

    initExport();

});

```



---



#### 6. Replace global function usage



Replace all inline HTML event handlers such as:



```html

onclick="openProfilePanel(id)"

```



with JavaScript event listeners:



```js

element.addEventListener("click", () => {

    openProfilePanel(id);

});

```



Avoid exposing functions on `window` unless absolutely necessary.



---



#### 7. Update imports



Replace side-effect imports:



```js

import "./js/components/login.js";

```



with explicit imports:



```js

import { initLogin } from "./js/components/login.js";

```



Import only what is actually used.



---



#### 8. Preserve functionality



Do not change:



* Business logic

* UI layout

* Styling

* Local storage format

* Data models

* Existing application behavior



Only improve the module organization and initialization flow.



---



#### 9. Improve module boundaries



Each module should have a clear responsibility:



* **utils/** → reusable helper functions only

* **store/** → data management and persistence

* **components/** → rendering, UI updates, and event handling

* **main.js** → application bootstrap and initialization



Avoid circular dependencies wherever possible.



---



#### 10. Final deliverables



Provide:



1. The refactored file structure.

2. Updated imports/exports for every modified file.

3. A summary of all architectural changes.

4. Any remaining issues or circular dependencies that should be addressed.

5. Ensure the project runs exactly as before, but with explicit initialization and modular ES Module best practices.

ill paste the files next