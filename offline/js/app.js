function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
  }
}

function openModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  resetModal();
}

function nextStep(step) {
  const currentStep = step - 1;
  const nextContent = document.getElementById(`step${step}`);
  const currentContent = document.getElementById(`step${currentStep}`);
  
  if (currentContent) currentContent.classList.add('hidden');
  if (nextContent) nextContent.classList.remove('hidden');
  
  updateStepIndicators(step);
}

function prevStep(step) {
  const currentStep = step + 1;
  const prevContent = document.getElementById(`step${step}`);
  const currentContent = document.getElementById(`step${currentStep}`);
  
  if (currentContent) currentContent.classList.add('hidden');
  if (prevContent) prevContent.classList.remove('hidden');
  
  updateStepIndicators(step);
}

function updateStepIndicators(currentStep) {
  const indicators = document.querySelectorAll('.step-indicator');
  indicators.forEach((indicator, index) => {
    const stepNum = index + 1;
    indicator.classList.remove('active', 'completed');
    
    if (stepNum < currentStep) {
      indicator.classList.add('completed');
    } else if (stepNum === currentStep) {
      indicator.classList.add('active');
    }
  });
}

function resetModal() {
  const contents = document.querySelectorAll('.modal-content');
  contents.forEach((content, index) => {
    if (index === 0) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });
  
  updateStepIndicators(1);
}

function saveUpdate() {
  const btn = document.querySelector('#step3 .btn-primary');
  btn.textContent = 'Salvando...';
  btn.disabled = true;
  
  setTimeout(() => {
    closeModal();
    btn.textContent = 'Salvar Atualização';
    btn.disabled = false;
    alert('Atualização salva com sucesso!');
  }, 1500);
}

function openProject() {
  openModal();
}

document.addEventListener('DOMContentLoaded', () => {
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    card.addEventListener('click', openProject);
  });

  const overlay = document.getElementById('modalOverlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
});
