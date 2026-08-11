import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <h1>🚀 Project Launch Pad</h1>
    <p class="subtitle">Live AWS CloudFront Deployment Test</p>
    
    <div class="input-group">
      <input type="text" id="task-input" placeholder="Enter a new feature or task..." />
      <button id="add-btn">Add Task</button>
    </div>

    <ul id="task-list"></ul>
  </div>
`

// Simple Task Logic
const input = document.getElementById('task-input') as HTMLInputElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const list = document.getElementById('task-list') as HTMLUListElement

const tasks: string[] = JSON.parse(localStorage.getItem('tasks') || '[]')

function renderTasks() {
  list.innerHTML = ''
  tasks.forEach((task, index) => {
    const li = document.createElement('li')
    li.innerHTML = `
      <span>${task}</span>
      <button onclick="removeTask(${index})">❌</button>
    `
    list.appendChild(li)
  })
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

addBtn.addEventListener('click', () => {
  if (input.value.trim()) {
    tasks.push(input.value.trim())
    input.value = ''
    renderTasks()
  }
})

;(window as any).removeTask = (index: number) => {
  tasks.splice(index, 1)
  renderTasks()
}

renderTasks()