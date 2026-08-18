// Keep the web Response sample exactly in sync with Android MainActivity.responseData.
// The old web sample was truncated/odd-length, which caused "Invalid Hex input".
(function () {
  const ANDROID_RESPONSE_SAMPLE = '600001000204103020010002C102549200010000000086680013010002303036333030303031303030303030303030304C43333531360022313839313731307E323032333131303231393237313501385F2A0203565F340100820239008407A0000000041010950504400480009A032311029B02E8009C01009F02060000000086689F03060000000000009F0607A00000000410109F1A0203569F260848F62634320FD64D9F2701809F3303E0F8C89F34034203009F3501229F36020E4E9F3704ED63B1099F10120110A00001220000000000000000000000FF0007535543434553530060307C317C3030303030303030304C43333531367C36333030303031307C3030303237337C3030313238397C3030303930317C4D41535445527C0006303030393031';

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
