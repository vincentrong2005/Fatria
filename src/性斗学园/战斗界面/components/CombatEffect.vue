<template>
  <Teleport to="body">
    <Transition name="effect-fade">
      <div v-if="show" class="combat-effect" :class="effectType">
        <div class="effect-content">
          <div class="effect-icon">{{ icon }}</div>
          <div class="effect-text">{{ text }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  type: 'critical' | 'partial-dodge' | 'dodge' | 'climax' | 'victory' | 'defeat';
  show: boolean;
}>();

const iconMap = {
  critical: '💥',
  'partial-dodge': '💨',
  dodge: '✨',
  climax: '💫',
  victory: '🎉',
  defeat: '💔',
};

const textMap = {
  critical: '暴击！',
  'partial-dodge': '闪避！',
  dodge: '完全闪避！',
  climax: '高潮！',
  victory: '胜利！',
  defeat: '败北...',
};

const icon = ref(iconMap[props.type]);
const text = ref(textMap[props.type]);
const effectType = ref(props.type);

watch(
  () => props.type,
  newType => {
    icon.value = iconMap[newType];
    text.value = textMap[newType];
    effectType.value = newType;
  },
);
</script>

<style scoped lang="scss">
.combat-effect {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  pointer-events: none;
  user-select: none;
}

.effect-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.effect-icon {
  font-size: 8rem;
  line-height: 1;
  animation: effect-pulse 0.6s ease-out;
  filter: drop-shadow(0 0 20px currentColor);
}

.effect-text {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  animation: effect-slide-up 0.6s ease-out;
  text-shadow:
    0 0 20px currentColor,
    0 0 40px currentColor;
}

// 特效类型样式
.critical {
  .effect-icon,
  .effect-text {
    color: #fbbf24;
    text-shadow:
      0 0 20px #fbbf24,
      0 0 40px #fbbf24,
      0 0 60px #f59e0b;
  }
}

.dodge {
  .effect-icon,
  .effect-text {
    color: #60a5fa;
    text-shadow:
      0 0 20px #60a5fa,
      0 0 40px #3b82f6,
      0 0 60px #2563eb;
    animation: effect-full-dodge 0.7s ease-out;
  }
}

.partial-dodge {
  .effect-icon,
  .effect-text {
    color: #5eead4;
    text-shadow:
      0 0 16px #5eead4,
      0 0 32px #14b8a6,
      0 0 48px #0f766e;
  }

  .effect-icon {
    animation: effect-partial-dodge 0.6s ease-out;
  }
}

.climax {
  .effect-icon,
  .effect-text {
    color: #f472b6;
    text-shadow:
      0 0 20px #f472b6,
      0 0 40px #ec4899,
      0 0 60px #db2777;
    animation: effect-climax 1s ease-out;
  }
}

.victory {
  .effect-icon,
  .effect-text {
    color: #4ade80;
    text-shadow:
      0 0 20px #4ade80,
      0 0 40px #22c55e,
      0 0 60px #16a34a;
  }
}

.defeat {
  .effect-icon,
  .effect-text {
    color: #94a3b8;
    text-shadow:
      0 0 20px #94a3b8,
      0 0 40px #64748b,
      0 0 60px #475569;
  }
}

// 动画
@keyframes effect-pulse {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

@keyframes effect-slide-up {
  0% {
    transform: translateY(50px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes effect-partial-dodge {
  0% {
    transform: translateX(70px) scale(0.75);
    opacity: 0;
  }
  55% {
    transform: translateX(-12px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes effect-full-dodge {
  0% {
    transform: scale(0.35) rotate(-18deg);
    opacity: 0;
  }
  45% {
    transform: scale(1.3) rotate(8deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes effect-climax {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1) rotate(5deg);
  }
  75% {
    transform: scale(1.1) rotate(-5deg);
  }
}

.effect-fade-enter-active,
.effect-fade-leave-active {
  transition: opacity 0.3s ease;
}

.effect-fade-enter-from,
.effect-fade-leave-to {
  opacity: 0;
}
</style>
