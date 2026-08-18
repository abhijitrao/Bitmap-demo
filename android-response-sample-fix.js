// Keep the web Response sample exactly as provided for Android-compatible parser testing.
// Do not alter ISO field parsing rules here; parsing must follow Iso.kt.
(function () {
  const ANDROID_RESPONSE_SAMPLE = '60000100910210347001000EC1A070920001000000240000000000438500618272220005460000001748530002363232353738363638343832202020202020393934343839303036333030303030373030303030303030304C433335504B0022333732303936327E323032363038313331373438353303560392001130303A417070726F7665640136303030353333333432423035353030303539333333323030353934353445323032303230323032303230323032303230323032303230323032303230323032303230323033333339333234413530353941353030303230303030363138323732323230363245324530303030353934353445323032303230323032303230323032303230323032303230323032303230323032300092307C337C35307C3030303030303030304248303030337C42485430303030337C3030303038307C3030303735347C3030303436377C564953417C7C31303332363038313330373132373438363239303230363735353933373933347C';

  function setResponseMode() {
    document.querySelectorAll('.mode').forEach(btn => btn.classList.remove('active'));
    const responseBtn = document.querySelector('.mode[data-mode="response"]');
    responseBtn?.classList.add('active');
    const input = document.getElementById('input');
    if (input) input.value = ANDROID_RESPONSE_SAMPLE;
    window.doParse?.();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const responseBtn = document.querySelector('.mode[data-mode="response"]');
    const sampleBtn = document.getElementById('sampleBtn');
    responseBtn?.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation(); setResponseMode();
    }, true);
    sampleBtn?.addEventListener('click', event => {
      const active = document.querySelector('.mode.active')?.dataset.mode;
      if (active !== 'response') return;
      event.preventDefault(); event.stopImmediatePropagation();
      document.getElementById('input').value = ANDROID_RESPONSE_SAMPLE;
      window.doParse?.();
    }, true);
  });
})();
