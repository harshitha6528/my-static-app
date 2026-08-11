import './style.css'

type Priority = 'low' | 'medium' | 'high'
type Category = 'work' | 'personal' | 'urgent'

interface Subtask {
  id: string
  text: string
  completed: boolean
}

interface Task {
  id: string
  text: string
  notes?: string
  completed: boolean
  priority: Priority
  category: Category
  dueDate?: string
  createdAt: number
  subtasks: Subtask[]
}

let tasks: Task[] = JSON.parse(localStorage.getItem('tasks') || '[]')
let currentFilter: 'all' | 'active' | 'completed' = 'all'
let currentSort: 'newest' | 'due' | 'priority' = 'newest'
let searchQuery: string = ''
let theme: 'dark' | 'light' = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
let editingTaskId: string | null = null

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="header-row">
      <div>
        <h1>🚀 Project Launch Pad</h1>
        <p class="subtitle">Full-Featured Task Management Suite</p>
      </div>
      <button id="theme-toggle" class="icon-btn" title="Toggle Theme">🌙</button>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-num" id="total-count">0</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-card">
        <span class="stat-num" id="active-count">0</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat-card">
        <span class="stat-num" id="completed-count">0</span>
        <span class="stat-label">Done</span>
      </div>
    </div>

    <div class="input-group">
      <input type="text" id="task-input" placeholder="Task title... (Press Enter to add)" />
    </div>

    <div class="notes-group">
      <textarea id="notes-input" placeholder="Optional notes or details..."></textarea>
    </div>

    <div class="meta-group">
      <select id="priority-select">
        <option value="low">🟢 Low</option>
        <option value="medium" selected>🟡 Medium</option>
        <option value="high">🔴 High</option>
      </select>
      <select id="category-select">
        <option value="work">💼 Work</option>
        <option value="personal">👤 Personal</option>
        <option value="urgent">⚡ Urgent</option>
      </select>
      <input type="date" id="date-input" />
      <button id="add-btn">Add Task</button>
    </div>

    <div class="search-group">
      <input type="text" id="search-input" placeholder="🔍 Search tasks or notes..." />
      <select id="sort-select">
        <option value="newest">Sort: Newest</option>
        <option value="due">Sort: Due Date</option>
        <option value="priority">Sort: Priority</option>
      </select>
    </div>

    <div class="filter-group">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="active">Active</button>
      <button class="filter-btn" data-filter="completed">Completed</button>
    </div>

    <ul id="task-list"></ul>

    <div class="action-bar">
      <button id="export-btn" class="secondary-btn">📥 Export JSON</button>
      <label for="import-file" class="secondary-btn label-btn">📤 Import JSON</label>
      <input type="file" id="import-file" accept=".json" style="display:none" />
      <button id="clear-done-btn" class="danger-btn">🧹 Clear Done</button>
    </div>
  </div>
`

// DOM Elements
const input = document.getElementById('task-input') as HTMLInputElement
const notesInput = document.getElementById('notes-input') as HTMLTextAreaElement
const dateInput = document.getElementById('date-input') as HTMLInputElement
const searchInput = document.getElementById('search-input') as HTMLInputElement
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement
const categorySelect = document.getElementById('category-select') as HTMLSelectElement
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const list = document.getElementById('task-list') as HTMLUListElement
const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn')
const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement
const importFile = document.getElementById('import-file') as HTMLInputElement
const clearDoneBtn = document.getElementById('clear-done-btn') as HTMLButtonElement

const totalCountEl = document.getElementById('total-count')!
const activeCountEl = document.getElementById('active-count')!
const completedCountEl = document.getElementById('completed-count')!

function applyTheme() {
  document.body.className = theme === 'light' ? 'light-mode' : ''
  themeToggleBtn.textContent = theme === 'light' ? '☀️' : '🌙'
  localStorage.setItem('theme', theme)
}

themeToggleBtn.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark'
  applyTheme()
})

function updateStats() {
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const active = total - completed

  totalCountEl.textContent = total.toString()
  activeCountEl.textContent = active.toString()
  completedCountEl.textContent = completed.toString()
}

function getPriorityWeight(p: Priority): number {
  return p === 'high' ? 3 : p === 'medium' ? 2 : 1
}

function renderTasks() {
  list.innerHTML = ''
  const today = new Date().toISOString().split('T')[0]

  let filteredTasks = tasks.filter(task => {
    const matchesFilter = currentFilter === 'all' || 
      (currentFilter === 'active' && !task.completed) || 
      (currentFilter === 'completed' && task.completed)
    
    const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesFilter && matchesSearch
  })

  filteredTasks.sort((a, b) => {
    if (currentSort === 'due') {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    }
    if (currentSort === 'priority') {
      return getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
    }
    return b.createdAt - a.createdAt
  })

  filteredTasks.forEach((task) => {
    const isOverdue = task.dueDate && task.dueDate < today && !task.completed
    const isEditing = editingTaskId === task.id

    const totalSub = task.subtasks ? task.subtasks.length : 0
    const completedSub = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0
    const progressPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0

    const li = document.createElement('li')
    li.className = `${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`
    
    if (isEditing) {
      li.innerHTML = `
        <div class="edit-mode-group">
          <input type="text" id="edit-val-${task.id}" value="${task.text}" />
          <button class="save-btn" onclick="saveEdit('${task.id}')">💾</button>
          <button class="cancel-btn" onclick="cancelEdit()">❌</button>
        </div>
      `
    } else {
      li.innerHTML = `
        <div class="task-container">
          <div class="task-main">
            <div class="task-content">
              <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" />
              <span class="task-title" onclick="startEdit('${task.id}')">${task.text}</span>
            </div>
            <div class="badges">
              <span class="badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
              <span class="badge category-tag">${task.category}</span>
              ${task.dueDate ? `<span class="badge date-tag ${isOverdue ? 'badge-overdue' : ''}">📅 ${task.dueDate}</span>` : ''}
            </div>
          </div>

          ${task.notes ? `<p class="task-notes">📝 ${task.notes}</p>` : ''}

          ${totalSub > 0 ? `
            <div class="subtask-progress">
              <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <span class="subtask-count">${completedSub}/${totalSub} Subtasks</span>
          ` : ''}

          <div class="subtask-list">
            ${(task.subtasks || []).map(st => `
              <div class="subtask-item ${st.completed ? 'completed-sub' : ''}">
                <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="toggleSubtask('${task.id}', '${st.id}')" />
                <span>${st.text}</span>
                <button class="small-del" onclick="removeSubtask('${task.id}', '${st.id}')">×</button>
              </div>
            `).join('')}
            <div class="add-subtask-row">
              <input type="text" id="sub-input-${task.id}" placeholder="+ Add subtask..." onkeydown="if(event.key==='Enter') addSubtask('${task.id}')" />
              <button onclick="addSubtask('${task.id}')">+</button>
            </div>
          </div>
        </div>

        <div class="btn-group">
          <button class="edit-btn" onclick="startEdit('${task.id}')">✏️</button>
          <button class="delete-btn" onclick="removeTask('${task.id}')">❌</button>
        </div>
      `
    }
    list.appendChild(li)
  })

  updateStats()
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

function createNewTask() {
  if (input.value.trim()) {
    tasks.push({
      id: Date.now().toString(),
      text: input.value.trim(),
      notes: notesInput.value.trim() || undefined,
      completed: false,
      priority: prioritySelect.value as Priority,
      category: categorySelect.value as Category,
      dueDate: dateInput.value || undefined,
      createdAt: Date.now(),
      subtasks: []
    })
    input.value = ''
    notesInput.value = ''
    dateInput.value = ''
    renderTasks()
  }
}

addBtn.addEventListener('click', createNewTask)

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') createNewTask()
})

searchInput.addEventListener('input', (e) => {
  searchQuery = (e.target as HTMLInputElement).value
  renderTasks()
})

sortSelect.addEventListener('change', (e) => {
  currentSort = (e.target as HTMLSelectElement).value as 'newest' | 'due' | 'priority'
  renderTasks()
})

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentFilter = btn.dataset.filter as 'all' | 'active' | 'completed'
    renderTasks()
  })
})

exportBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute("href", dataStr)
  downloadAnchor.setAttribute("download", `tasks_backup_${new Date().toISOString().slice(0,10)}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
})

importFile.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target?.result as string)
        if (Array.isArray(importedTasks)) {
          tasks = importedTasks
          renderTasks()
        }
      } catch (err) {
        alert('Invalid JSON file format')
      }
    }
    reader.readAsText(file)
  }
})

clearDoneBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed)
  renderTasks()
})

// Exposed Handlers
;(window as any).toggleTask = (id: string) => {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  renderTasks()
}

;(window as any).removeTask = (id: string) => {
  tasks = tasks.filter(t => t.id !== id)
  renderTasks()
}

;(window as any).startEdit = (id: string) => {
  editingTaskId = id
  renderTasks()
}

;(window as any).cancelEdit = () => {
  editingTaskId = null
  renderTasks()
}

;(window as any).saveEdit = (id: string) => {
  const editInput = document.getElementById(`edit-val-${id}`) as HTMLInputElement
  if (editInput && editInput.value.trim()) {
    tasks = tasks.map(t => t.id === id ? { ...t, text: editInput.value.trim() } : t)
    editingTaskId = null
    renderTasks()
  }
}

;(window as any).addSubtask = (taskId: string) => {
  const subInput = document.getElementById(`sub-input-${taskId}`) as HTMLInputElement
  if (subInput && subInput.value.trim()) {
    tasks = tasks.map(t => {
      if (t.id === taskId) {
        const subtasks = t.subtasks || []
        return {
          ...t,
          subtasks: [...subtasks, { id: Date.now().toString(), text: subInput.value.trim(), completed: false }]
        }
      }
      return t
    })
    renderTasks()
  }
}

;(window as any).toggleSubtask = (taskId: string, subtaskId: string) => {
  tasks = tasks.map(t => {
    if (t.id === taskId) {
      const subtasks = t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
      return { ...t, subtasks }
    }
    return t
  })
  renderTasks()
}

;(window as any).removeSubtask = (taskId: string, subtaskId: string) => {
  tasks = tasks.map(t => {
    if (t.id === taskId) {
      return { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId) }
    }
    return t
  })
  renderTasks()
}

applyTheme()
renderTasks()