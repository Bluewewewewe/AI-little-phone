(function () {
  'use strict';

  // ===== DOM =====
  var homeScreen = document.getElementById('homeScreen');
  var appScreen = document.getElementById('appScreen');
  var appContent = document.getElementById('appContent');
  var backBtn = document.getElementById('backBtn');
  var statusTime = document.getElementById('statusTime');
  var gridContainer = document.getElementById('gridContainer');
  var gridSlider = document.getElementById('gridSlider');
  var pageDots = document.getElementById('pageDots');
  var dots = pageDots.querySelectorAll('.dot');

  // ===== 状态栏时间 =====
  function updateTime() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    statusTime.textContent = h + ':' + m;
  }
  updateTime();
  setInterval(updateTime, 10000);

  // ===== 滑动翻页 =====
  var currentPage = 0;
  var totalPages = 2;
  var startX = 0;
  var currentX = 0;
  var isDragging = false;
  var sliderWidth = 0;

  function setSliderPosition(offset) {
    gridSlider.style.transform = 'translateX(' + offset + 'px)';
  }

  function goToPage(page, animate) {
    currentPage = Math.max(0, Math.min(page, totalPages - 1));
    sliderWidth = gridContainer.offsetWidth;
    var target = -currentPage * sliderWidth;

    if (animate !== false) {
      gridSlider.style.transition = 'transform 0.2s ease';
    } else {
      gridSlider.style.transition = 'none';
    }
    setSliderPosition(target);

    // 更新指示点
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === currentPage);
    }
  }

  // Touch 事件
  gridContainer.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    currentX = startX;
    isDragging = true;
    sliderWidth = gridContainer.offsetWidth;
    gridSlider.style.transition = 'none';
  }, { passive: true });

  gridContainer.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    var diff = currentX - startX;
    var base = -currentPage * sliderWidth;
    setSliderPosition(base + diff);
  }, { passive: true });

  gridContainer.addEventListener('touchend', function () {
    if (!isDragging) return;
    isDragging = false;
    var diff = currentX - startX;
    var threshold = sliderWidth * 0.2;

    if (diff < -threshold && currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    } else if (diff > threshold && currentPage > 0) {
      goToPage(currentPage - 1);
    } else {
      goToPage(currentPage);
    }
  });

  // 鼠标拖拽
  gridContainer.addEventListener('mousedown', function (e) {
    startX = e.clientX;
    currentX = startX;
    isDragging = true;
    sliderWidth = gridContainer.offsetWidth;
    gridSlider.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    currentX = e.clientX;
    var diff = currentX - startX;
    var base = -currentPage * sliderWidth;
    setSliderPosition(base + diff);
  });

  document.addEventListener('mouseup', function () {
    if (!isDragging) return;
    isDragging = false;
    var diff = currentX - startX;
    var threshold = sliderWidth * 0.2;

    if (diff < -threshold && currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    } else if (diff > threshold && currentPage > 0) {
      goToPage(currentPage - 1);
    } else {
      goToPage(currentPage);
    }
  });

  // 窗口 resize 时修正位置
  window.addEventListener('resize', function () {
    goToPage(currentPage, false);
  });

  // ===== APP 打开/关闭 =====
  function openApp(appId) {
    // 清空内容区
    appContent.innerHTML = '';
    // 切换屏幕
    homeScreen.classList.remove('active');
    appScreen.classList.add('active');
  }

  function closeApp() {
    appScreen.classList.remove('active');
    homeScreen.classList.add('active');
  }

  // 所有 APP 图标点击
  document.addEventListener('click', function (e) {
    var icon = e.target.closest('[data-app]');
    if (icon) {
      openApp(icon.getAttribute('data-app'));
    }
  });

  // 返回按钮
  backBtn.addEventListener('click', function () {
    closeApp();
  });

  // ===== 初始化 =====
  goToPage(0, false);

})();
