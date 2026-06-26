(function iniciarIntercepcionHibrida() {
    // Restaurar el fetch nativo antes de aplicar el nuevo para evitar duplicados
    if (window._originalFetchBackup) {
        window.fetch = window._originalFetchBackup;
    } else {
        window._originalFetchBackup = window.fetch;
    }

    console.log("🚀 Interceptor Universal Activado (Soporta perfil propio y de terceros).");
    console.log("👉 Haz clic en cualquier integrante de la lista para iniciar la descarga...");

    let nombreDetectado = "Mi_Usuario_Logueado"; // Nombre por defecto si es tu propio perfil

    // Capturamos el clic justo antes de que se dispare la solicitud de red
    document.addEventListener('click', function(event) {
        const tarjetaUsuario = event.target.closest('a') || event.target.closest('.ranking-widget_container__Eg-08 > div');
        
        if (tarjetaUsuario) {
            const bdi = tarjetaUsuario.querySelector('bdi');
            if (bdi && bdi.textContent) {
                nombreDetectado = bdi.textContent.trim();
            }
        }
    }, true);

    // Interceptor único de Red
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0];

        if (typeof url === 'string' && (url.includes('Games/GetAllGamesForOtherUser') || url.includes('Games/GetAllGames'))) {
            // Guardamos el nombre determinado en este hilo de ejecución
            const nombreFinal = nombreDetectado;
            console.log(`📥 Interceptando y procesando datos para: ${nombreFinal}`);

            try {
                const response = await originalFetch(...args);
                const clone = response.clone();
                const data = await clone.json();

                const estructuraFrontend = {
                    usuario: nombreFinal,
                    games: data.games || data
                };

                const contenidoJS = `const quinielaData = ${JSON.stringify(estructuraFrontend, null, 4)};`;

                // Forzar descarga única
                const blob = new Blob([contenidoJS], { type: 'application/javascript;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                
                const nombreArchivo = `datos_${nombreFinal.replace(/\s+/g, '_')}.js`;
                link.download = nombreArchivo;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                console.log(`✅ Archivo único generado con éxito: ${nombreArchivo}`);
                return response;

            } catch (err) {
                console.error("❌ Error al procesar la petición de la quiniela:", err);
            }
        }

        return originalFetch(...args);
    };
})();
