require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();

// Configuración para confiar en el proxy (Nginx u otros)
app.set('trust proxy', true);

// Configuración CORS
const corsOptions = {
    origin: ['http://190.215.38.222', 'http://localhost:8100', 'http://190.215.38.222:9595'], // Ajustar en producción
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permitir el envío de cookies
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Lala1234', // Cambia en producción
    database: process.env.DB_NAME || 'bd2',
    port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1); // Salir del proceso si hay error en conexión
    }
    console.log('Conectado a la base de datos.');
});

// Prefijo de API
const apiPrefix = '/api';

// Nuevo endpoint: Verificar primer inicio de sesión
app.post(`${apiPrefix}/check-first-login`, (req, res) => {
    const { correo } = req.body;

    if (!correo) {
        return res.status(400).json({ error: 'El correo es obligatorio.' });
    }

    db.query('SELECT * FROM credencial_user12 WHERE correo = ?', [correo], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error en el servidor al consultar el usuario.' });
        }

        if (results.length === 0) {
            console.warn('Correo no encontrado:', correo);
            return res.status(404).json({ isNewUser: false, message: 'Usuario no encontrado.' });
        }

        const user = results[0];

        // Verificar si es el primer inicio de sesión
        const isNewUser = user.primer_inicio === 1;

        if (isNewUser) {
            console.log(`Reinicio de estado para el usuario ${correo}`);
            db.query(
                'UPDATE credencial_user12 SET debe_cambiar_contrasena = ?, primer_inicio = ? WHERE correo = ?',
                [true, true, correo],
                (updateErr) => {
                    if (updateErr) {
                        console.error('Error al reiniciar el estado del usuario:', updateErr);
                        return res.status(500).json({ error: 'Error al reiniciar el estado del usuario.' });
                    }

                    res.json({ isNewUser: true, message: 'Estado reiniciado. Usuario en primer inicio.' });
                }
            );
        } else {
            res.json({ isNewUser: false, message: 'El usuario ya completó el proceso inicial.' });
        }
    });
});

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
    host: 'correo.sanbernardo.cl',
    port: 25,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'credenciales@sanbernardo.cl',
        pass: process.env.EMAIL_PASS || 'Cs9173.,',
    },
});

// Manejo de rutas de subida de fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/perfiles';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de tamaño: 5 MB
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = /jpeg|jpg|png/;
        const mimetype = allowedFileTypes.test(file.mimetype);
        const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen (JPEG/PNG).'));
        }
    },
});

// Endpoint para subir la foto de perfil
app.post('/api/subir-foto', upload.single('imagen_perfil'), (req, res) => {
    const { correo } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    if (!correo) {
        return res.status(400).json({ error: 'El correo es obligatorio.' });
    }

    const filePath = `/uploads/perfiles/${req.file.filename}`;

    db.query(
        'UPDATE credencial_user12 SET imagen_perfil = ?, primer_inicio = 0 WHERE correo = ?',
        [filePath, correo],
        (err, result) => {
            if (err) {
                console.error('Error al actualizar la base de datos:', err);
                return res.status(500).json({ error: 'Error en el servidor.' });
            }

            if (result.affectedRows === 0) {
                fs.unlinkSync(`uploads/perfiles/${req.file.filename}`);
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            res.json({ status: 'Foto actualizada correctamente.', filePath });
        }
    );
});

// Middleware para manejar errores de multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Manejar errores específicos de multer
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  } else if (err) {
    // Manejar otros errores
    return res.status(400).json({ error: err.message });
  }
  next();
});



// Registro de usuario
app.post(`${apiPrefix}/register`, (req, res) => {
    const { nombre_completo, rut, direccion, departamento, telefono, correo, contrasena } = req.body;

    db.query('SELECT * FROM credencial_user12 WHERE correo = ?', [correo], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });
        if (results.length > 0) return res.status(400).json({ status: 'El correo ya está registrado' });

        const hash = bcrypt.hashSync(contrasena, 10);
        db.query('INSERT INTO credencial_user12 SET ?', { nombre_completo, rut, direccion, departamento, telefono, correo, contrasena: hash, debe_cambiar_contrasena: true }, (err) => {
            if (err) return res.status(500).json({ error: 'Error en el servidor' });
            res.json({ status: 'Usuario registrado' });
        });
    });
});

// Inicio de sesión
app.post(`${apiPrefix}/login`, (req, res) => {
    const { correo, contrasena } = req.body;

    // Validación de campos requeridos
    if (!correo || !contrasena) {
        return res.status(400).json({ status: 'Correo y contraseña son obligatorios.' });
    }

    db.query('SELECT * FROM credencial_user12 WHERE correo = ?', [correo], (err, results) => {
        if (err) {
            console.error('Error en la consulta de base de datos:', err);
            return res.status(500).json({ error: 'Error en el servidor. Intente nuevamente.' });
        }

        if (results.length === 0) {
            console.log(`Usuario con correo ${correo} no encontrado`);
            return res.status(400).json({ status: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Registro del estado del usuario para depuración
        console.log(`Estado del usuario con correo ${correo}: ${user.estado}`);

        // Verificar si el usuario está activo
        if (user.estado.toLowerCase() !== 'activo') {
            console.log(`El usuario con correo ${correo} está inactivo o el valor del estado es inesperado`);
            return res.status(403).json({ status: 'El usuario está inactivo. Contacte al administrador.' });
        }

        // Validar la contraseña
        try {
            const isPasswordValid = bcrypt.compareSync(contrasena, user.contrasena);
            if (!isPasswordValid) {
                console.log(`Contraseña incorrecta para el usuario con correo ${correo}`);
                return res.status(400).json({ status: 'Contraseña incorrecta' });
            }
        } catch (passwordError) {
            console.error('Error al comparar las contraseñas:', passwordError);
            return res.status(500).json({ error: 'Error en la validación de la contraseña.' });
        }

        // Verificar si es el primer inicio de sesión
        const primerInicio = !!user.primer_inicio; // Asegúrate de que sea booleano

        // Generar el token JWT
        const token = jwt.sign(
            { id: user.id, correo: user.correo },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '1h' }
        );

        console.log(`Inicio de sesión exitoso para el usuario con correo ${correo}`);
        return res.json({
            token,
            debeCambiarContrasena: user.debe_cambiar_contrasena,
            primerInicio,
            status: 'Login exitoso',
        });
    });
});


// Verificar si el correo existe y enviar enlace de recuperación
app.post(`${apiPrefix}/verify-email`, (req, res) => {
  const { correo } = req.body;

  // Verificar si el correo existe en la base de datos
  db.query('SELECT * FROM credencial_user12 WHERE correo = ?', [correo], (err, results) => {
      if (err) {
          console.error('Error en el servidor al consultar la base de datos:', err);
          return res.status(500).json({ error: 'Error en el servidor al consultar la base de datos' });
      }

      if (results.length === 0) {
          console.warn('Correo no encontrado:', correo);
          return res.status(404).json({ status: 'Correo no encontrado' });
      }

      // Generar token y fecha de expiración
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hora

      // Actualizar el token y su expiración en la base de datos
      db.query(
          'UPDATE credencial_user12 SET reset_token = ?, reset_expires = ? WHERE correo = ?',
          [token, expires, correo],
          (updateErr) => {
              if (updateErr) {
                  console.error('Error al guardar el token en la base de datos:', updateErr);
                  return res.status(500).json({ error: 'Error al guardar el token' });
              }

              // Generar el enlace de restablecimiento
              const resetLink = `http://190.215.38.222:9595/reset-password?token=${token}&email=${encodeURIComponent(correo)}`;

              // Configurar opciones del correo
              const mailOptions = {
                  from: 'credenciales@sanbernardo.cl',
                  to: correo,
                  subject: 'Recuperación de Contraseña',
                  html: `
                      <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                      <p>Usa el siguiente enlace para actualizarla:</p>
                      <a href="${resetLink}">${resetLink}</a>
                      <p>Este enlace es válido por 1 hora.</p>
                  `,
              };

              // Enviar el correo
              transporter.sendMail(mailOptions, (mailErr) => {
                  if (mailErr) {
                      console.error('Error al enviar el correo:', mailErr);
                      return res.status(500).json({ error: 'Error al enviar el correo' });
                  }
                  console.log('Correo enviado exitosamente a:', correo);
                  res.json({ status: 'Correo enviado' });
              });
          }
      );
  });
});

// Actualizar contraseña
app.post(`${apiPrefix}/update-password`, (req, res) => {
  const { token, nuevaContrasena, correo } = req.body;

  // Verificar si el token es válido y no ha expirado
  db.query(
      'SELECT * FROM credencial_user12 WHERE correo = ? AND reset_token = ? AND reset_expires > NOW()',
      [correo, token],
      (err, results) => {
          if (err) {
              console.error('Error en el servidor al verificar el token:', err);
              return res.status(500).json({ error: 'Error en el servidor' });
          }

          if (results.length === 0) {
              console.warn('Token inválido o expirado para el correo:', correo);
              return res.status(400).json({ status: 'Token inválido o expirado' });
          }

          // Hashear la nueva contraseña
          const hash = bcrypt.hashSync(nuevaContrasena, 10);

          // Actualizar la contraseña y limpiar el token
          db.query(
              'UPDATE credencial_user12 SET contrasena = ?, debe_cambiar_contrasena = ?, reset_token = NULL, reset_expires = NULL WHERE correo = ?',
              [hash, false, correo],
              (updateErr, result) => {
                  if (updateErr) {
                      console.error('Error al actualizar la contraseña:', updateErr);
                      return res.status(500).json({ error: 'Error al actualizar la contraseña' });
                  }

                  if (result.affectedRows > 0) {
                      console.log('Contraseña actualizada correctamente para el correo:', correo);
                      res.json({ status: 'Contraseña actualizada' });
                  } else {
                      console.warn('No se pudo actualizar la contraseña para el correo:', correo);
                      res.status(500).json({ error: 'Error al actualizar la contraseña' });
                  }
              }
          );
      }
  );
});



// Panel de administrador: Activar/Desactivar usuario
app.put(`${apiPrefix}/update-status/:id`, (req, res) => {
    const { estado } = req.body;

    db.query('UPDATE credencial_user12 SET estado = ? WHERE id = ?', [estado, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });
        res.json({ status: `Usuario ${estado}` });
    });
});

// Eliminar usuario por ID
app.delete(`${apiPrefix}/users/:id`, (req, res) => {
    db.query('DELETE FROM credencial_user12 WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });
        res.json({ status: result.affectedRows > 0 ? 'Usuario eliminado correctamente' : 'Usuario no encontrado' });
    });
});

// Obtener usuarios por correo o RUT
app.get(`${apiPrefix}/users`, (req, res) => {
    const { search } = req.query;
    const query = search ? 'SELECT * FROM credencial_user12 WHERE correo LIKE ? OR rut LIKE ?' : 'SELECT * FROM credencial_user12';
    const queryParams = search ? [`%${search}%`, `%${search}%`] : [];

    db.query(query, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });
        res.json(results.length > 0 ? results : { status: 'No se encontraron usuarios' });
    });
});

// Servir archivos estáticos de Ionic
app.use(express.static(path.join(__dirname, 'www')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirige todas las rutas a index.html para manejar rutas desde el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Escuchar en el puerto definido en el archivo .env o en el 9595
const PORT = process.env.PORT || 9595;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
