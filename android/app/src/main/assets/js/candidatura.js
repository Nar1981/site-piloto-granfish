// candidatura.js - Job application form handler
// Handles CV upload to Supabase Storage and form submission

(function () {
  'use strict';

  // Wait for DOM and Supabase config to load
  function init() {
    const form = document.getElementById('form-candidatura');
    if (!form) return;

    const cvInput = document.getElementById('cv');
    const cvPreview = document.getElementById('cv-preview');
    const cvName = document.getElementById('cv-name');
    const cvSize = document.getElementById('cv-size');
    const submitBtn = document.getElementById('btn-submit');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const erroMsg = document.getElementById('mensagem-erro');
    const sucessoMsg = document.getElementById('mensagem-sucesso');

    // Format file size
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // Show selected file info
    if (cvInput) {
      cvInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
          // Validate file type
          if (file.type !== 'application/pdf') {
            alert('Apenas arquivos PDF são aceitos.');
            this.value = '';
            cvPreview.style.display = 'none';
            return;
          }
          // Validate file size (10 MB)
          if (file.size > 10 * 1024 * 1024) {
            alert('O arquivo deve ter no máximo 10 MB.');
            this.value = '';
            cvPreview.style.display = 'none';
            return;
          }
          cvName.textContent = file.name;
          cvSize.textContent = formatSize(file.size);
          cvPreview.style.display = 'block';
        } else {
          cvPreview.style.display = 'none';
        }
      });
    }

    // Format phone number
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
      telefoneInput.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 7) {
          this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
        } else if (v.length > 2) {
          this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
        } else if (v.length > 0) {
          this.value = '(' + v;
        }
      });
    }

    // Form submission
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Hide previous messages
      erroMsg.style.display = 'none';
      sucessoMsg.style.display = 'none';

      // Validate declaration
      const declaracao = document.getElementById('declaracao');
      if (!declaracao.checked) {
        erroMsg.textContent = 'Por favor, aceite a declaração para continuar.';
        erroMsg.style.display = 'block';
        return;
      }

      // Get form data
      const formData = new FormData(form);
      const cvFile = formData.get('cv');

      // Check if CV is provided
      if (!cvFile || cvFile.size === 0) {
        erroMsg.textContent = 'Por favor, envie seu currículo em PDF.';
        erroMsg.style.display = 'block';
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';

      try {
        // Upload CV to Supabase Storage
        const fileName = 'cv-' + Date.now() + '-' + cvFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('candidaturas')
          .put(fileName, cvFile, {
            contentType: cvFile.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('candidaturas')
          .getPublicUrl(fileName);

        // Prepare application data
        const aplicacao = {
          nome: formData.get('nome'),
          email: formData.get('email'),
          telefone: formData.get('telefone'),
          cargo: formData.get('cargo'),
          experiencia: formData.get('experiencia'),
          experiencia_desc: formData.get('experiencia_desc'),
          cv_nome: cvFile.name,
          cv_caminha: fileName,
          cv_url: urlData.publicUrl,
          linkedin: formData.get('linkedin'),
          mensagem: formData.get('mensagem'),
          data_candidatura: new Date().toISOString()
        };

        // Insert into Supabase database
        const { error: dbError } = await supabase
          .from('candidaturas')
          .insert([aplicacao]);

        if (dbError) throw dbError;

        // Show success message
        sucessoMsg.textContent = 'Candidatura enviada com sucesso! Entraremos em contato em breve.';
        sucessoMsg.style.display = 'block';
        form.reset();
        cvPreview.style.display = 'none';

      } catch (err) {
        console.error('Erro ao enviar candidatura:', err);
        erroMsg.textContent = 'Erro ao enviar candidatura. Por favor, tente novamente mais tarde.';
        erroMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    });
  }

  // Initialize when Supabase is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
