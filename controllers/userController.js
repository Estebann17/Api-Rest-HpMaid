const Report = require("../models/Report");
const User = require("../models/user");
const cloudinary = require("cloudinary").v2;
const ApiCards = require("../models/apiCards");
const Card = require("../models/card");
const { getUserRanking } = require("../helpers/getUserRanking");

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: "dxnmbudpc",
  api_key: "648922466288911",
  api_secret: "4_Ph6mi1EHZY83SH2ybrg7QJ6hw",
});

const userController = {
  async register(req, res) {
    try {
      const { data } = req.body;

      // Obtener la dirección de correo electrónico de la respuesta
      const userEmail = data.email_addresses[0].email_address;

      // Verificar si ya existe un usuario con ese correo electrónico en la base de datos
      const existingUser = await User.findOne({ email: userEmail });

      if (existingUser) {
        console.log("Usuario ya existe");
        return res.status(400).json({
          message: "El usuario ya existe con este correo electrónico",
        });
      }

      // Si no existe, crear un nuevo usuario en la base de datos
      const newUser = new User({
        email: userEmail,
      });

      // Agregar campos adicionales
      newUser.name = "User";
      newUser.nick = "NewUser";
      newUser.banner = "https://i.postimg.cc/VNN272ND/paisaje.png";
      newUser.image = "https://i.postimg.cc/ZRvmNYYp/foto-perfil150.png";
      newUser.bio = "undefined";
      newUser.userRole = "user";

      // Guardar el nuevo usuario en la base de datos
      await newUser.save();

      res
        .status(201)
        .json({ message: "Usuario creado exitosamente", user: newUser });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creando el usuario", error: error.message });
    }
  },
  async login(req, res) {
    try {
      const { data } = req.body;

      if (!data) {
        res.status(404).json({ message: "Error en el login" });
      }

      res.status(200).json({ message: "Login exitoso" });
    } catch (error) {
      console.error("Error en el proceso de inicio de sesión:", error);
      res.status(500).json({
        message: "Error en el proceso de inicio de sesión",
        error: error.message,
      });
    }
  },

  async update(req, res) {
    try {
      const { email, name, bio, nick, twitter, instagram, facebook, spotify } =
        req.body;

      // Verificar si existe un usuario con el correo electrónico proporcionado
      const userToUpdate = await User.findOne({ email });

      if (!userToUpdate) {
        return res.status(404).json({
          message: "Usuario no encontrado con este correo electrónico",
        });
      }

      // Actualizar los campos especificados
      if (name) userToUpdate.name = name;
      if (bio) userToUpdate.bio = bio;
      if (nick) userToUpdate.nick = nick;
      userToUpdate.twitter = twitter || null;
      userToUpdate.instagram = instagram || null;
      userToUpdate.facebook = facebook || null;
      userToUpdate.spotify = spotify || null;

      // Función para manejar la subida de imágenes
      const uploadImage = (imageBuffer) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "image" }, (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve(result.secure_url);
            })
            .end(imageBuffer);
        });
      };

      // Función para validar el tipo de archivo
      const isValidImageType = (mimeType) => {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
        ];
        return allowedTypes.includes(mimeType);
      };

      // Función para procesar una imagen
      const processImage = async (file, type) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`La imagen de ${type} no debe ser superior a 5 MB`);
        }

        if (!isValidImageType(file.mimetype)) {
          throw new Error(
            `La imagen de ${type} debe ser de tipo jpg, jpeg, png o gif`
          );
        }

        try {
          const imageUrl = await uploadImage(file.buffer);
          userToUpdate[type] = imageUrl;
        } catch (error) {
          console.error(
            `Error subiendo la imagen de ${type} a Cloudinary:`,
            error
          );
          throw new Error(
            `Error subiendo la imagen de ${type} a Cloudinary: ${error.message}`
          );
        }
      };

      // Comprobar y subir la imagen de perfil si se proporciona en la solicitud
      if (req.files && req.files["profileImage"]) {
        if (!isValidImageType(req.files["profileImage"][0].mimetype)) {
          return res.status(406).json({
            message:
              "El archivo de imagen de perfil debe ser de tipo jpg, jpeg, png o gif",
          });
        }
        await processImage(req.files["profileImage"][0], "image");
      }

      // Comprobar y subir la imagen de banner si se proporciona en la solicitud
      if (req.files && req.files["bannerImage"]) {
        if (!isValidImageType(req.files["bannerImage"][0].mimetype)) {
          return res.status(406).json({
            message:
              "El archivo de imagen de banner debe ser de tipo jpg, jpeg, png o gif",
          });
        }
        await processImage(req.files["bannerImage"][0], "banner");
      }

      // Guardar los cambios en la base de datos
      await userToUpdate.save();
      res.status(200).json({
        message: "Usuario actualizado exitosamente",
        user: userToUpdate,
      });
    } catch (error) {
      console.error("Error actualizando el usuario:", error);
      res.status(500).json({
        message: "Error actualizando el usuario",
        error: error.message,
      });
    }
  },
  async getProfileWithEmail(req, res) {
    try {
      const { email } = req.params;

      // Verificar si se proporcionó un correo electrónico en los parámetros de la solicitud
      if (!email) {
        return res.status(400).json({
          message:
            "El correo electrónico es obligatorio en los parámetros de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por correo electrónico
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: "Usuario no encontrado con este correo electrónico",
        });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Error obteniendo el perfil del usuario:", error);
      res.status(500).json({
        message: "Error obteniendo el perfil del usuario",
        error: error.message,
      });
    }
  },
  async getProfile(req, res) {
    try {
      const { email } = req.body;

      // Verificar si se proporcionó un correo electrónico en el cuerpo de la solicitud
      if (!email) {
        return res.status(400).json({
          message:
            "El correo electrónico es obligatorio en el cuerpo de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por correo electrónico
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: "Usuario no encontrado con este correo electrónico",
        });
      }

      res.status(200).json({ message: "Perfil encontrado exitosamente", user });
    } catch (error) {
      console.error("Error obteniendo el perfil del usuario:", error);
      res.status(500).json({
        message: "Error obteniendo el perfil del usuario",
        error: error.message,
      });
    }
  },
  async getAllUsersForAdmins(req, res) {
    try {
      // Obtener todos los usuarios de la base de datos
      const users = await User.find();

      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No hay usuarios registrados" });
      }

      res
        .status(200)
        .json({ message: "Usuarios encontrados exitosamente", users });
    } catch (error) {
      console.error("Error obteniendo todos los usuarios:", error);
      res.status(500).json({
        message: "Error obteniendo todos los usuarios",
        error: error.message,
      });
    }
  },
  async getAllUsers(req, res) {
    try {
      let { page } = req.params;
      page = parseInt(page) || 1;
      const limit = 20;
      const startIndex = (page - 1) * limit;

      // Realizar la consulta de paginación
      const result = await User.paginate(
        {},
        {
          offset: startIndex,
          limit,
          allowDiskUse: true,
        }
      );

      // Calcular el rango de páginas a mostrar (por ejemplo, mostrar solo alrededor de 6 páginas)
      const totalPages = result.totalPages;
      const maxPagesToShow = 6;
      let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Ajustar el inicio y el final de las páginas a mostrar para que haya exactamente maxPagesToShow
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      // Obtener los números de página a mostrar
      const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );

      res.json({
        currentPage: page,
        totalPages: totalPages,
        totalUsers: result.totalDocs,
        pageNumbers: pageNumbers,
        users: result.docs,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        mensaje: "Error al obtener todos los usuarios",
        error,
      });
    }
  },

  async searchUsers(req, res) {
    try {
      let { page, searchQuery } = req.params;
      page = parseInt(page) || 1;
      const limit = 20;
      const startIndex = (page - 1) * limit;

      // Realiza la consulta de paginación de usuarios
      const users = await User.find({
        $or: [
          { name: { $regex: new RegExp(searchQuery, "i") } },
          { email: { $regex: new RegExp(searchQuery, "i") } },
        ],
      })
        .skip(startIndex)
        .limit(limit);

      // Obtén el total de usuarios que coinciden con la búsqueda
      const totalUsers = await User.countDocuments({
        $or: [
          { name: { $regex: new RegExp(searchQuery, "i") } },
          { email: { $regex: new RegExp(searchQuery, "i") } },
        ],
      });

      // Si no se encontraron usuarios, devuelve un mensaje específico
      if (users.length === 0) {
        return res.status(404).json({
          message: "No se encontraron resultados",
        });
      }

      // Calcular la información de paginación
      const totalPages = Math.ceil(totalUsers / limit);
      const maxPagesToShow = 6;
      let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );

      res.status(200).json({
        currentPage: page,
        totalPages: totalPages,
        totalUsers: totalUsers,
        pageNumbers: pageNumbers,
        users: users,
      });
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
      res.status(500).json({
        message: "Error al buscar usuarios",
        error: error.message,
      });
    }
  },

  async getProfileById(req, res) {
    try {
      const { id } = req.params; // Obtener el ID de usuario de los parámetros de la solicitud

      // Verificar si se proporcionó un ID de usuario en los parámetros de la solicitud
      if (!id) {
        return res.status(400).json({
          message:
            "El ID de usuario es obligatorio en los parámetros de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por ID de usuario
      const user = await User.findById(id);

      if (!user) {
        return res
          .status(404)
          .json({ message: "Usuario no encontrado con este ID" });
      }

      res.status(200).json({ message: "Perfil encontrado exitosamente", user });
    } catch (error) {
      console.error("Error obteniendo el perfil del usuario por ID:", error);
      res.status(500).json({
        message: "Error obteniendo el perfil del usuario por ID",
        error: error.message,
      });
    }
  },

  async reportUser(req, res) {
    try {
      const reporterEmail = req.body.reporterEmail;
      const userReportedId = req.body.id;
      const cause = req.body.cause;

      // Buscar al usuario que reporta
      const reporter = await User.findOne({ email: reporterEmail });

      if (!reporter) {
        return res.status(404).json({ message: "Reporter not found" });
      }

      if (!userReportedId) {
        return res.status(400).json({ message: "Invalid userReportedId" });
      }

      // Guardar el reporte en la base de datos
      const report = new Report({
        reporter: reporter._id,
        reportedUser: userReportedId,
        cause: cause,
      });

      await report.save();

      return res.status(200).json({ message: "User reported successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async reportOfficial(req, res) {
    try {
      const reporterEmail = req.body.reporterEmail;

      // Crear el contenido del informe oficial
      const reportContent = `Oficial: El usuario puede ser nuevo o hizo trampas`;

      // Buscar al usuario reportado
      const reportedUser = await User.findOne({ email: reporterEmail });

      if (!reportedUser) {
        return res.status(404).json({ message: "Reported user not found" });
      }

      // Guardar el reporte en la base de datos
      const report = new Report({
        reportedUser: reportedUser._id,
        cause: reportContent,
      });

      await report.save();

      return res
        .status(200)
        .json({ message: "Official report created successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async getPossibleCheaters(req, res) {
    try {
      const reports = await Report.find({
        cause:
          "Reporte oficial: El usuario puede ser nuevo o hizo trampas en la obtención de cartas",
      });

      const reportCountMap = new Map();

      for (const report of reports) {
        const userId = report.reportedUser.toString();
        if (reportCountMap.has(userId)) {
          reportCountMap.set(userId, reportCountMap.get(userId) + 1);
        } else {
          reportCountMap.set(userId, 1);
        }

        await User.findByIdAndUpdate(userId, {
          $inc: { cheatReportsCount: 1 },
        });
      }

      const possibleCheaters = [];
      for (const [userId, count] of reportCountMap.entries()) {
        if (count >= 3) {
          const user = await User.findById(userId);
          possibleCheaters.push({
            userId,
            userName: user.name,
            userEmail: user.email,
            reportCount: count,
          });
        }
      }

      if (possibleCheaters.length > 0) {
        const response = {
          message:
            "Usuarios que podrían haber hecho trampa en la obtención de cartas",
          cheaters: possibleCheaters,
        };
        return res.status(200).json(response);
      } else {
        // Si no hay usuarios con 2 o más reportes, devolver un mensaje indicando que no se encontraron tramposos
        return res
          .status(200)
          .json({ message: "No se encontraron usuarios que hicieron trampa" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async getAvatar(req, res) {
    try {
      const { email } = req.body; // Obtener el correo electrónico del cuerpo de la solicitud

      // Verificar si se proporcionó un correo electrónico en el cuerpo de la solicitud
      if (!email) {
        return res.status(400).json({
          message:
            "El correo electrónico es obligatorio en el cuerpo de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por correo electrónico
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: "Usuario no encontrado con este correo electrónico",
        });
      }

      // Devolver la URL de la imagen del usuario
      res.status(200).json(user.image);
    } catch (error) {
      console.error("Error obteniendo el avatar del usuario:", error);
      res.status(500).json({
        message: "Error obteniendo el avatar del usuario",
        error: error.message,
      });
    }
  },

  async createApiCard(req, res) {
    try {
      const cardData = req.body; // Supongo que los datos se envían en el cuerpo de la solicitud

      // Crea una nueva instancia del modelo ApiCard
      const newApiCard = new ApiCards(cardData);

      // Guarda la tarjeta en la base de datos
      const savedApiCard = await newApiCard.save();

      res.status(201).json(savedApiCard);
    } catch (error) {
      console.error("Error al crear una nueva tarjeta API:", error);
      res.status(500).json({
        error: "Error interno del servidor al crear una nueva tarjeta API.",
      });
    }
  },

  async getProfileRank(req, res) {
    try {
      const { email } = req.body;

      // Verificar si se proporcionó un correo electrónico en el cuerpo de la solicitud
      if (!email) {
        return res.status(400).json({
          message:
            "El correo electrónico es obligatorio en el cuerpo de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por correo electrónico
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Obtener todas las cartas que pertenecen al usuario
      const userCards = await Card.find({ "user.id": user._id });

      // Inicializar el objeto para contar la cantidad de cartas por rareza
      const cardCountsByRarity = {
        Comun: 0,
        Plata: 0,
        Oro: 0,
        Raro: 0,
        epico: 0,
        Mitico: 0,
      };
      console.log(userCards);

      // Calcular la cantidad de cartas por rareza y los puntos totales
      let totalPoints = 0;
      userCards.forEach((card) => {
        const rarity = card.content.rareza;
        switch (rarity) {
          case "Comun":
            cardCountsByRarity.Comun++;
            totalPoints += 1;
            break;
          case "Plata":
            cardCountsByRarity.Plata++;
            totalPoints += 2;
            break;
          case "Oro":
            cardCountsByRarity.Oro++;
            totalPoints += 4;
            break;
          case "Raro":
            cardCountsByRarity.Raro++;
            totalPoints += 6;
            break;
          case "epico":
            cardCountsByRarity.epico++;
            totalPoints += 10;
            break;
          case "Mitico":
            cardCountsByRarity.Mitico++;
            totalPoints += 14;
            break;
          default:
            break;
        }
      });

      // Obtener el total de cartas
      const totalCards = userCards.length;

      // Obtener el lugar en el ranking del usuario actual
      const placeInRanking = await getUserRanking(email);

      return res.status(200).json({
        totalPoints,
        cardCountsByRarity,
        totalCards,
        user: { image: user.image, name: user.name },
        placeInRanking,
      });
    } catch (error) {
      console.error("Error al obtener el rango del perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async getUsersRank(req, res) {
    try {
      // Obtener número de página de la solicitud
      const page = parseInt(req.query.page) || 1;

      // Calcular el índice de inicio y fin para la paginación
      const perPage = 20;
      const startIndex = (page - 1) * perPage;

      // Obtener todos los usuarios
      const users = await User.find();

      // Si no hay usuarios, devolver un arreglo vacío
      if (users.length === 0) {
        return res
          .status(200)
          .json({ currentPage: page, totalPages: 1, usersRank: [] });
      }

      // Array para almacenar la información de cada usuario con sus puntos totales
      const usersRank = [];

      // Iterar sobre cada usuario para calcular los puntos totales
      for (let i = 0; i < users.length; i++) {
        const user = users[i];

        // Obtener todas las cartas que pertenecen al usuario
        const userCards = await Card.find({ "user.id": user._id });

        // Inicializar el objeto para contar la cantidad de cartas por rareza
        const cardCountsByRarity = {
          Comun: 0,
          Plata: 0,
          Oro: 0,
          Raro: 0,
          epico: 0,
          Mitico: 0,
        };

        // Calcular la cantidad de cartas por rareza y los puntos totales
        let totalPoints = 0;
        userCards.forEach((card) => {
          const rarity = card.content.rareza;
          switch (rarity) {
            case "Common":
              cardCountsByRarity.Comun++;
              totalPoints += 1;
              break;
            case "Silver":
              cardCountsByRarity.Plata++;
              totalPoints += 2;
              break;
            case "Gold":
              cardCountsByRarity.Oro++;
              totalPoints += 4;
              break;
            case "Rare":
              cardCountsByRarity.Raro++;
              totalPoints += 6;
              break;
            case "Epic":
              cardCountsByRarity.epico++;
              totalPoints += 10;
              break;
            case "Mythical":
              cardCountsByRarity.Mitico++;
              totalPoints += 14;
              break;
            default:
              break;
          }
        });

        // Agregar la información del usuario al array
        usersRank.push({ user, totalPoints });
      }

      // Ordenar el array de usuarios por totalPoints de mayor a menor
      usersRank.sort((a, b) => b.totalPoints - a.totalPoints);

      // Obtener el rango de usuarios que corresponden a esta página
      const usersForPage = usersRank.slice(startIndex, startIndex + perPage);

      // Obtener el número total de páginas
      const totalPages = Math.ceil(usersRank.length / perPage);

      // Enviar respuesta con el resultado de la paginación y el ranking de usuarios
      return res
        .status(200)
        .json({ currentPage: page, totalPages, usersRank: usersForPage });
    } catch (error) {
      console.error("Error al obtener el ranking de usuarios:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};

module.exports = userController;
