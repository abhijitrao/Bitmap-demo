// Keep the web Response sample exactly as provided for Android-compatible parser testing.
// Do not alter ISO field parsing rules here; parsing must follow Iso.kt.
(function () {
  const ANDROID_RESPONSE_SAMPLE = '60000100910210323001020EC182109200010000000012010625120703000173260625120659000215303030303034333338343434393534373832333839323231373936202020202020343434393534303036333030303132313030303030303030304248554E49310019353334397E3230323630363235313230373030035600158A0100910801D611C31988565171000133307C327C35307C3030303030343534303534383132307C32333230303032357C3030303031327C3030303032377C3030303031357C414D45587C7C31303232363036323530333439363830343238383239373331303838333738347C3439367C52656365697074486561646572317C53616D706C6520546573747C4E45572044454C48497C';

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
      event.preventDefault();
      event.stopImmediatePropagation();
      setResponseMode();
    }, true);

    sampleBtn?.addEventListener('click', event => {
      const active = document.querySelector('.mode.active')?.dataset.mode;
      if (active !== 'response') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById('input').value = ANDROID_RESPONSE_SAMPLE;
      window.doParse?.();
    }, true);
  });
})();
