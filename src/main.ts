import './style.css'

type Priority = 'low' | 'medium' | 'high'
type Category = 'work' | 'personal' | 'urgent'

interface Task {
  id: string
  text: string
  completed: boolean
  priority: Priority
  category: Category
}

let tasks: Task[] = JSON.parse(localStorage.getItem('tasks') || '[]')
let currentFilter: 'all' | 'active' | 'completed' = 'all'
let searchQuery: string = ''
let theme: 'dark' | 'light' = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="header-row">
      <div>
        <h1>🚀 Project Launch Pad</h1>
        <p class="subtitle">Live AWS CloudFront Deployment Test</p>
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
      <input type="text" id="task-input" placeholder="Enter a new task..." />
    </div>

    <div class="meta-group">
      <select id="priority-select">
        <option value="low">🟢 Low Priority</option>
        <option value="medium" selected>🟡 Medium Priority</option>
        <option value="high">🔴 High Priority</option>
      </select>
      <select id="category-select">
        <option value="work">💼 Work</option>
        <option value="personal">👤 Personal</option>
        <option value="urgent">⚡ Urgent</option>
      </select>
      <button id="add-btn">Add Task</button>
    </div>

    <div class="search-group">
      <input type="text" id="search-input" placeholder="🔍 Search tasks..." />
    </div>

    <div class="filter-group">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="active">Active</button>
      <button class="filter-btn" data-filter="completed">Completed</button>
    </div>

    <ul id="task-list"></ul>
  </div>
`

const input = document.getElementById('task-input') as HTMLInputElement
const searchInput = document.getElementById('search-input') as HTMLInputElement
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement
const categorySelect = document.getElementById('category-select') as HTMLSelectElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const list = document.getElementById('task-list') as HTMLUListElement
const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn')
const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement

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

function renderTasks() {
  list.innerHTML = ''
  
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = currentFilter === 'all' || 
      (currentFilter === 'active' && !task.completed) || 
      (currentFilter === 'completed' && task.completed)
    
    const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  filteredTasks.forEach((task) => {
    const li = document.createElement('li')
    li.className = task.completed ? 'completed' : ''
    li.innerHTML = `
      <div class="task-main">
        <div class="task-content">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" />
          <span>${task.text}</span>
        </div>
        <div class="badges">
          <span class="badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
          <span class="badge category-tag">${task.category}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="removeTask('${task.id}')">❌</button>
    `
    list.appendChild(li)
  })

  updateStats()
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

addBtn.addEventListener('click', () => {
  if (input.value.trim()) {
    tasks.push({
      id: Date.now().toString(),
      text: input.value.trim(),
      completed: false,
      priority: prioritySelect.value as Priority,
      category: categorySelect.value as Category
    })
    input.value = ''
    renderTasks()
  }
})

searchInput.addEventListener('input', (e) => {
  searchQuery = (e.target as HTMLInputElement).value
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

;(window as any).toggleTask = (id: string) => {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  renderTasks()
}

;(window as any).removeTask = (id: string) => {
  tasks = tasks.filter(t => t.id !== id)
  renderTasks()
}

applyTheme()
renderTasks()