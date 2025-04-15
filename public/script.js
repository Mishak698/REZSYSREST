document.addEventListener('DOMContentLoaded', function() {
      const reserveBtn = document.getElementById('reserveBtn');
      const refreshBtn = document.getElementById('refreshBtn');
      const resultDiv = document.getElementById('result');
      const reservationsList = document.getElementById('reservationsList');
      
      
      document.getElementById('date').valueAsDate = new Date();
      
      reserveBtn.addEventListener('click', async function() {
          const people = document.getElementById('people').value;
          const date = document.getElementById('date').value;
          const time = document.getElementById('time').value;
          const duration = document.getElementById('duration').value;
          
          try {
              const response = await fetch('/api/reserve', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      people,
                      date,
                      time,
                      duration
                  })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                  resultDiv.innerHTML = `<p class="success">${data.message}</p>`;
                  loadReservations();
                  document.getElementById('people').value = '';
                  document.getElementById('time').value = '';
              } else {
                  resultDiv.innerHTML = `<p class="error">${data.error}</p>`;
              }
          } catch (error) {
              resultDiv.innerHTML = `<p class="error">Chyba při komunikaci se serverem: ${error.message}</p>`;
          }
      });
      
      async function loadReservations() {
          try {
              const response = await fetch('/api/reservations');
              const reservations = await response.json();
              
              if (reservations.length === 0) {
                  reservationsList.innerHTML = '<p>Žádné aktivní rezervace</p>';
                  return;
              }
              
              let html = '';
              reservations.forEach(reservation => {
                  html += `
                      <div class="reservation">
                          <p><strong>ID:</strong> ${reservation.id}</p>
                          <p><strong>Počet lidí:</strong> ${reservation.people}</p>
                          <p><strong>Datum:</strong> ${formatDate(reservation.date)}</p>
                          <p><strong>Čas:</strong> ${reservation.time}</p>
                          <p><strong>Délka:</strong> ${reservation.duration} minut</p>
                          <p><strong>Stůl:</strong> ${reservation.tables.join(', ')}</p>
                          <button onclick="cancelReservation(${reservation.id})">Zrušit rezervaci</button>
                      </div>
                  `;
              });
              
              reservationsList.innerHTML = html;
          } catch (error) {
              reservationsList.innerHTML = `<p class="error">Chyba při načítání rezervací: ${error.message}</p>`;
          }
      }
      
      function formatDate(dateString) {
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          return new Date(dateString).toLocaleDateString('cs-CZ', options);
      }
      
      window.cancelReservation = async function(id) {
          if (!confirm('Opravdu chcete zrušit tuto rezervaci?')) return;
          
          try {
              const response = await fetch(`/api/cancel/${id}`, {
                  method: 'POST'
              });
              
              const data = await response.json();
              
              if (response.ok) {
                  alert(data.message);
                  loadReservations();
              } else {
                  alert(data.error);
              }
          } catch (error) {
              alert(`Chyba při zrušování rezervace: ${error.message}`);
          }
      };
      
      refreshBtn.addEventListener('click', loadReservations);
      loadReservations();
  });