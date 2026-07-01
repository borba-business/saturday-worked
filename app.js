const storageKey = "saturdayWorkedApp";
const defaultTemplate = {
  id: "default-saturday-worked",
  name: "Saturday worked",
  body: "Hi, I would like to confirm that I worked on Saturday {date}, from {hours}."
};

const state = loadState();

const composeTab = document.getElementById("composeTab");
const settingsTab = document.getElementById("settingsTab");
const composePanel = document.getElementById("composePanel");
const settingsPanel = document.getElementById("settingsPanel");
const recipientSelect = document.getElementById("recipientSelect");
const recipientName = document.getElementById("recipientName");
const recipientEmail = document.getElementById("recipientEmail");
const saveRecipient = document.getElementById("saveRecipient");
const newRecipient = document.getElementById("newRecipient");
const recipientList = document.getElementById("recipientList");
const subject = document.getElementById("subject");
const workedDate = document.getElementById("workedDate");
const calendarToggle = document.getElementById("calendarToggle");
const calendarPanel = document.getElementById("calendarPanel");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");
const hours = document.getElementById("hours");
const templateSelect = document.getElementById("templateSelect");
const message = document.getElementById("message");
const openEmail = document.getElementById("openEmail");
const resetDate = document.getElementById("resetDate");
const resetMessage = document.getElementById("resetMessage");
const templateName = document.getElementById("templateName");
const templateBody = document.getElementById("templateBody");
const saveTemplate = document.getElementById("saveTemplate");
const newTemplate = document.getElementById("newTemplate");
const templateList = document.getElementById("templateList");

let editingRecipientId = state.selectedRecipientId;
let editingTemplateId = state.selectedTemplateId;
let calendarDate = new Date();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const templates = Array.isArray(saved.templates) && saved.templates.length
      ? saved.templates
      : [defaultTemplate];
    const recipients = Array.isArray(saved.recipients)
      ? saved.recipients
      : (saved.recipient ? [{
          id: "recipient-migrated",
          name: "Saved recipient",
          email: saved.recipient
        }] : []);

    return {
      recipients,
      hours: saved.hours || "10:00 to 16:00",
      subject: saved.subject || "Saturday Worked",
      selectedRecipientId: saved.selectedRecipientId || (recipients[0] ? recipients[0].id : ""),
      selectedTemplateId: saved.selectedTemplateId || templates[0].id,
      templates
    };
  } catch (error) {
    return {
      recipients: [],
      hours: "10:00 to 16:00",
      subject: "Saturday Worked",
      selectedRecipientId: "",
      selectedTemplateId: defaultTemplate.id,
      templates: [defaultTemplate]
    };
  }
}

function saveState() {
  state.hours = hours.value.trim();
  state.subject = subject.value.trim() || "Saturday Worked";

  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    return;
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDisplayDate(date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function parseDisplayDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
}

function sameDay(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function getLastSaturday(fromDate) {
  const date = new Date(fromDate);
  const day = date.getDay();
  const daysSinceSaturday = day === 6 ? 7 : (day + 1) % 7;
  date.setDate(date.getDate() - daysSinceSaturday);
  return date;
}

function selectedRecipient() {
  return state.recipients.find((item) => item.id === state.selectedRecipientId) || state.recipients[0] || null;
}

function selectedTemplate() {
  return state.templates.find((item) => item.id === state.selectedTemplateId) || state.templates[0];
}

function buildMessage() {
  return selectedTemplate().body
    .replaceAll("{date}", workedDate.value.trim())
    .replaceAll("{hours}", hours.value.trim());
}

function refreshMessage() {
  message.value = buildMessage();
}

function formatDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [];

  if (digits.length > 0) {
    parts.push(digits.slice(0, 2));
  }

  if (digits.length > 2) {
    parts.push(digits.slice(2, 4));
  }

  if (digits.length > 4) {
    parts.push(digits.slice(4, 8));
  }

  return parts.join("/");
}

function setWorkedDate(date) {
  workedDate.value = toDisplayDate(date);
  calendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
  refreshMessage();
  renderCalendar();
}

function renderCalendar() {
  const today = new Date();
  const selected = parseDisplayDate(workedDate.value);
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());
  const monthName = firstDay.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric"
  });

  calendarTitle.textContent = monthName;
  calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const button = document.createElement("button");
    button.className = "calendar-day";
    button.type = "button";
    button.textContent = String(date.getDate());

    if (date.getMonth() !== month) {
      button.classList.add("outside");
    }

    if (sameDay(date, today)) {
      button.classList.add("today");
    }

    if (selected && sameDay(date, selected)) {
      button.classList.add("selected");
    }

    button.addEventListener("click", function () {
      setWorkedDate(date);
      calendarPanel.hidden = true;
    });

    calendarGrid.appendChild(button);
  }
}

function renderRecipientSelect() {
  recipientSelect.innerHTML = "";

  if (!state.recipients.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Add recipient in Settings";
    recipientSelect.appendChild(option);
    return;
  }

  state.recipients.forEach((recipient) => {
    const option = document.createElement("option");
    option.value = recipient.id;
    option.textContent = `${recipient.name} <${recipient.email}>`;
    option.selected = recipient.id === state.selectedRecipientId;
    recipientSelect.appendChild(option);
  });
}

function renderRecipientList() {
  recipientList.innerHTML = "";

  state.recipients.forEach((recipient) => {
    const row = document.createElement("div");
    row.className = "saved-row";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selectedRecipient";
    radio.checked = recipient.id === state.selectedRecipientId;
    radio.addEventListener("change", function () {
      state.selectedRecipientId = recipient.id;
      editingRecipientId = recipient.id;
      saveState();
      renderAllRecipients();
      loadRecipientIntoEditor(recipient.id);
    });

    const content = document.createElement("div");
    const title = document.createElement("div");
    title.className = "saved-title";
    title.textContent = recipient.name;

    const preview = document.createElement("div");
    preview.className = "saved-preview";
    preview.textContent = recipient.email;

    content.append(title, preview);

    const editButton = document.createElement("button");
    editButton.className = "secondary";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function () {
      editingRecipientId = recipient.id;
      loadRecipientIntoEditor(recipient.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "danger";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
      deleteRecipient(recipient.id);
    });

    row.append(radio, content, editButton, deleteButton);
    recipientList.appendChild(row);
  });
}

function renderAllRecipients() {
  renderRecipientSelect();
  renderRecipientList();
}

function renderTemplateSelect() {
  templateSelect.innerHTML = "";

  state.templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    option.selected = template.id === state.selectedTemplateId;
    templateSelect.appendChild(option);
  });
}

function renderTemplateList() {
  templateList.innerHTML = "";

  state.templates.forEach((template) => {
    const row = document.createElement("div");
    row.className = "saved-row";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selectedTemplate";
    radio.checked = template.id === state.selectedTemplateId;
    radio.addEventListener("change", function () {
      state.selectedTemplateId = template.id;
      editingTemplateId = template.id;
      saveState();
      renderAllTemplates();
      loadTemplateIntoEditor(template.id);
      refreshMessage();
    });

    const content = document.createElement("div");
    const title = document.createElement("div");
    title.className = "saved-title";
    title.textContent = template.name;

    const preview = document.createElement("div");
    preview.className = "saved-preview";
    preview.textContent = template.body;

    content.append(title, preview);

    const editButton = document.createElement("button");
    editButton.className = "secondary";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function () {
      editingTemplateId = template.id;
      loadTemplateIntoEditor(template.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "danger";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
      deleteTemplate(template.id);
    });

    row.append(radio, content, editButton, deleteButton);
    templateList.appendChild(row);
  });
}

function renderAllTemplates() {
  renderTemplateSelect();
  renderTemplateList();
}

function loadRecipientIntoEditor(id) {
  const recipient = state.recipients.find((item) => item.id === id);

  if (!recipient) {
    recipientName.value = "";
    recipientEmail.value = "";
    return;
  }

  recipientName.value = recipient.name;
  recipientEmail.value = recipient.email;
}

function loadTemplateIntoEditor(id) {
  const template = state.templates.find((item) => item.id === id) || state.templates[0];
  templateName.value = template.name;
  templateBody.value = template.body;
}

function showPanel(name) {
  const showCompose = name === "compose";
  composePanel.hidden = !showCompose;
  settingsPanel.hidden = showCompose;
  composeTab.classList.toggle("active", showCompose);
  settingsTab.classList.toggle("active", !showCompose);
}

function openMailDraft() {
  const recipient = selectedRecipient();
  message.value = message.value.trim() || buildMessage();
  saveState();

  if (!recipient) {
    showPanel("settings");
    recipientEmail.focus();
    return;
  }

  const mailto = [
    `mailto:${encodeURIComponent(recipient.email)}`,
    `?subject=${encodeURIComponent(subject.value)}`,
    `&body=${encodeURIComponent(message.value)}`
  ].join("");

  window.location.href = mailto;
}

function saveRecipientFromEditor() {
  const email = recipientEmail.value.trim();

  if (!email) {
    recipientEmail.focus();
    return;
  }

  const name = recipientName.value.trim() || email;
  const existing = state.recipients.find((item) => item.id === editingRecipientId);

  if (existing) {
    existing.name = name;
    existing.email = email;
  } else {
    editingRecipientId = `recipient-${Date.now()}`;
    state.recipients.push({ id: editingRecipientId, name, email });
  }

  state.selectedRecipientId = editingRecipientId;
  saveState();
  renderAllRecipients();
}

function createNewRecipient() {
  editingRecipientId = "";
  recipientName.value = "";
  recipientEmail.value = "";
  recipientName.focus();
}

function deleteRecipient(id) {
  state.recipients = state.recipients.filter((item) => item.id !== id);

  if (state.selectedRecipientId === id) {
    state.selectedRecipientId = state.recipients[0] ? state.recipients[0].id : "";
  }

  if (editingRecipientId === id) {
    editingRecipientId = state.selectedRecipientId;
    loadRecipientIntoEditor(editingRecipientId);
  }

  saveState();
  renderAllRecipients();
}

function saveTemplateFromEditor() {
  const name = templateName.value.trim() || "Untitled message";
  const body = templateBody.value.trim();

  if (!body) {
    templateBody.focus();
    return;
  }

  const existing = state.templates.find((item) => item.id === editingTemplateId);

  if (existing) {
    existing.name = name;
    existing.body = body;
  } else {
    editingTemplateId = `template-${Date.now()}`;
    state.templates.push({ id: editingTemplateId, name, body });
  }

  state.selectedTemplateId = editingTemplateId;
  saveState();
  renderAllTemplates();
  refreshMessage();
}

function createNewTemplate() {
  editingTemplateId = "";
  templateName.value = "";
  templateBody.value = "Hi, I would like to confirm that I worked on Saturday {date}, from {hours}.";
  templateName.focus();
}

function deleteTemplate(id) {
  if (state.templates.length === 1) {
    return;
  }

  state.templates = state.templates.filter((item) => item.id !== id);

  if (state.selectedTemplateId === id) {
    state.selectedTemplateId = state.templates[0].id;
  }

  if (editingTemplateId === id) {
    editingTemplateId = state.selectedTemplateId;
    loadTemplateIntoEditor(editingTemplateId);
  }

  saveState();
  renderAllTemplates();
  refreshMessage();
}

subject.value = state.subject;
hours.value = state.hours;
setWorkedDate(getLastSaturday(new Date()));
renderAllRecipients();
loadRecipientIntoEditor(state.selectedRecipientId);
renderAllTemplates();
loadTemplateIntoEditor(state.selectedTemplateId);

composeTab.addEventListener("click", function () {
  showPanel("compose");
});

settingsTab.addEventListener("click", function () {
  showPanel("settings");
});

recipientSelect.addEventListener("change", function () {
  state.selectedRecipientId = recipientSelect.value;
  editingRecipientId = recipientSelect.value;
  saveState();
  renderAllRecipients();
  loadRecipientIntoEditor(recipientSelect.value);
});

saveRecipient.addEventListener("click", saveRecipientFromEditor);
newRecipient.addEventListener("click", createNewRecipient);
subject.addEventListener("input", saveState);
workedDate.addEventListener("input", function () {
  workedDate.value = formatDateInput(workedDate.value);
  const parsedDate = parseDisplayDate(workedDate.value);

  if (parsedDate) {
    calendarDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
    renderCalendar();
  }

  refreshMessage();
});
hours.addEventListener("input", function () {
  saveState();
  refreshMessage();
});

templateSelect.addEventListener("change", function () {
  state.selectedTemplateId = templateSelect.value;
  editingTemplateId = templateSelect.value;
  saveState();
  renderAllTemplates();
  loadTemplateIntoEditor(templateSelect.value);
  refreshMessage();
});

resetDate.addEventListener("click", function () {
  setWorkedDate(getLastSaturday(new Date()));
});

resetMessage.addEventListener("click", refreshMessage);
openEmail.addEventListener("click", openMailDraft);
saveTemplate.addEventListener("click", saveTemplateFromEditor);
newTemplate.addEventListener("click", createNewTemplate);
calendarToggle.addEventListener("click", function () {
  const parsedDate = parseDisplayDate(workedDate.value);

  if (parsedDate) {
    calendarDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
  }

  renderCalendar();
  calendarPanel.hidden = !calendarPanel.hidden;
});
prevMonth.addEventListener("click", function () {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});
nextMonth.addEventListener("click", function () {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});
