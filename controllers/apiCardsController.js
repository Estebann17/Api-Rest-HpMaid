const ApiCards = require("../models/apiCards");
const User = require("../models/user");
const Card = require("../models/card");
const paginate = require("mongoose-paginate-v2");

const apiCardsController = {
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

  async getAllCards(req, res) {
    try {
      const cartas = await ApiCards.find();
      res.json(cartas);
    } catch (error) {
      res.status(500).json({ mensaje: "Error al obtener las cartas", error });
    }
  },

  async getCardById(req, res) {
    try {
      // Obtener el mal_id de la carta desde la URL
      const { id } = req.params;

      // Buscar la carta en la base de datos por su mal_id
      const data = await ApiCards.findOne({ mal_id: id });

      // Verificar si la carta existe
      if (!data) {
        return res.status(404).json({ mensaje: "Carta no encontrada" });
      }

      // Responder con la carta encontrada
      res.json({ data });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ mensaje: "Error al obtener la carta por mal_id", error });
    }
  },

  async boostCard(req, res) {
    try {
      // Obtener el contenido de la carta desde la solicitud
      const { content } = req.body;

      // Validar si el contenido está presente en la solicitud
      if (!content || !content.mal_id) {
        return res.status(400).json({
          mensaje: "El contenido de la carta con mal_id es obligatorio",
        });
      }

      // Buscar la carta en la base de datos por su mal_id
      const carta = await ApiCards.findOne({ mal_id: content.mal_id });

      // Verificar si la carta existe
      if (!carta) {
        return res.status(400).json({ mensaje: "Carta no encontrada" });
      }

      // Aumentar el valor de .monedas en 1
      carta.monedas += 1;

      // Asignar rareza según la cantidad de monedas
      if (carta.monedas >= 700) {
        carta.rareza = "mitico";
      } else if (carta.monedas >= 500) {
        carta.rareza = "epico";
      } else if (carta.monedas >= 300) {
        carta.rareza = "raro";
      } else if (carta.monedas >= 200) {
        carta.rareza = "oro";
      } else if (carta.monedas >= 100) {
        carta.rareza = "plata";
      } else if (carta.monedas >= 50) {
        carta.rareza = "comun";
      }

      // Guardar la carta actualizada en la base de datos
      await carta.save();

      // Responder con la carta actualizada
      const cartaActualizada = await ApiCards.findOne({
        mal_id: content.mal_id,
      });

      // Enviar el nuevo valor en monedas de la carta y la rareza en la respuesta
      res.json({
        mensaje: "Carta potenciada exitosamente",
        newCoinsValue: cartaActualizada.monedas,
        rareza: cartaActualizada.rareza,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al potenciar la carta", error });
    }
  },

  async getTopCards(req, res) {
    try {
      // Obtener las tres cartas con mayor valor de monedas
      const topCards = await ApiCards.find().sort({ monedas: -1 }).limit(3);

      res.json(topCards);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ mensaje: "Error al obtener las cartas principales", error });
    }
  },

  async getAllCardsSortedByCoins(req, res) {
    try {
      let { page } = req.params;
      page = parseInt(page) || 1;
      const limit = 40;
      const startIndex = (page - 1) * limit;

      // Realiza la consulta de paginación
      const result = await ApiCards.paginate(
        {},
        {
          offset: startIndex,
          limit,
          allowDiskUse: true,
          sort: { monedas: -1 },
        }
      );

      // Ordenar los resultados por el campo 'monedas' si existe
      const sortedDocs = result.docs.sort((a, b) => {
        if (a.monedas && b.monedas) {
          return b.monedas - a.monedas;
        }
        return 0;
      });

      // Calcula el rango de páginas a mostrar (por ejemplo, mostrar solo alrededor de 6 páginas)
      const totalPages = result.totalPages;
      const maxPagesToShow = 6;
      let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Ajusta el inicio y el final de las páginas a mostrar para que haya exactamente maxPagesToShow
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      // Obtén los números de página a mostrar
      const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );

      res.json({
        totalCards: result.totalDocs,
        currentPage: page,
        totalPages: totalPages,
        pageNumbers: pageNumbers,
        cards: sortedDocs,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        mensaje: "Error al obtener todas las cartas ordenadas por monedas",
        error,
      });
    }
  },
  async exploredCards(req, res) {
    try {
      let { page } = req.params;
      const { email } = req.query;
      page = parseInt(page) || 1;
      const limit = 40;
      const startIndex = (page - 1) * limit;

      // Ordena todos los resultados por el campo 'monedas' de mayor a menor
      const sortedDocs = await ApiCards.find({})
        .sort({ monedas: -1 })
        .skip(startIndex)
        .limit(limit);

      // Obtén el usuario por su email
      const user = await User.findOne({ email: email });

      if (!user) {
        // Si no se encuentra ningún usuario, devuelve un mensaje de error
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      // Obtén los IDs de las cartas del usuario
      const userCardIds = user.cards.map((cardId) => cardId.toString());

      // Obtén las cartas del usuario por sus ObjectId
      const userCards = await Card.find({ _id: { $in: userCardIds } });

      // Obtén los 'mal_id' de las cartas del usuario
      const userMalIds = userCards.map((card) => card.mal_id.toString());

      // Agrega el valor 'blanco_negro' a cada carta devuelta
      const cardsWithBlancoNegro = sortedDocs.map((card) => {
        const userHasCard = userMalIds.includes(card.mal_id.toString());
        return {
          ...card.toObject(),
          blanco_negro: userHasCard,
        };
      });

      // Calcula el total de documentos (cartas) sin límite de paginación
      const totalCardsCount = await ApiCards.countDocuments();

      // Calcula el total de páginas en base al total de cartas y el límite por página
      const totalPages = Math.ceil(totalCardsCount / limit);

      // Calcula el rango de páginas a mostrar (por ejemplo, mostrar solo alrededor de 6 páginas)
      const maxPagesToShow = 6;
      let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Ajusta el inicio y el final de las páginas a mostrar para que haya exactamente maxPagesToShow
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      // Obtén los números de página a mostrar
      const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );

      res.json({
        totalCards: totalCardsCount,
        currentPage: page,
        totalPages: totalPages,
        pageNumbers: pageNumbers,
        cards: cardsWithBlancoNegro,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        mensaje: "Error al obtener todas las cartas ordenadas por monedas",
        error,
      });
    }
  },
  async searchCards(req, res) {
    try {
      let { page, searchQuery, email } = req.params;
      page = parseInt(page) || 1;
      const limit = 40;
      const startIndex = (page - 1) * limit;

      // Realizar la consulta de paginación utilizando ApiCards
      const result = await ApiCards.paginate(
        { name: { $regex: new RegExp(searchQuery, "i") } },
        {
          offset: startIndex,
          limit,
          allowDiskUse: true,
        }
      );

      if (result.docs.length === 0) {
        return res.status(404).json({ mensaje: "No se encontraron cartas" });
      }

      // Obtener el usuario por su email
      const user = await User.findOne({ email: email });

      if (!user) {
        // Si no se encuentra ningún usuario, devuelve un mensaje de error
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      // Obtener los IDs de las cartas del usuario
      const userCardIds = user.cards.map((cardId) => cardId.toString());

      // Obtener las cartas del usuario por sus ObjectId
      const userCards = await Card.find({ _id: { $in: userCardIds } });

      // Obtener los 'mal_id' de las cartas del usuario
      const userMalIds = userCards.map((card) => card.mal_id.toString());

      // Ordenar los resultados por el campo 'nombre' si existe
      const sortedDocs = result.docs.sort((a, b) => {
        if (a.nombre && b.nombre) {
          return a.nombre.localeCompare(b.nombre);
        }
        return 0;
      });

      // Agregar el valor 'blanco_negro' a cada carta devuelta
      const cardsWithBlancoNegro = sortedDocs.map((card) => {
        const userHasCard = userMalIds.includes(card.mal_id.toString());
        return {
          ...card.toObject(),
          blanco_negro: userHasCard,
        };
      });

      // Calcular el rango de páginas a mostrar
      const totalPages = result.totalPages;
      const maxPagesToShow = 6;
      let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Obtener los números de página a mostrar
      const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );

      res.json({
        totalCards: result.totalDocs,
        currentPage: page,
        totalPages: totalPages,
        pageNumbers: pageNumbers,
        cards: cardsWithBlancoNegro,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        mensaje: "Error al buscar cartas",
        error,
      });
    }
  },
  async addApiCardToFavorites(req, res) {
    try {
      const { id } = req.params;
      const { email } = req.params;

      // Buscar la carta de la API por su ID
      const apiCard = await ApiCards.findById(id);

      if (!apiCard) {
        return res
          .status(404)
          .json({ mensaje: "Carta de la API no encontrada" });
      }

      // Buscar al usuario por su email
      const user = await User.findOne({ email: email });

      if (!user) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      // Verificar si la carta ya está en favoritos del usuario
      const alreadyExists = user.favApiCards.includes(id);

      if (alreadyExists) {
        // Eliminar el ID de la carta del array de favoritos del usuario
        user.favApiCards = user.favApiCards.filter(
          (cardId) => cardId.toString() !== id
        );

        // Eliminar el correo electrónico del usuario del array de favoritos de la carta
        apiCard.favoritedBy = apiCard.favoritedBy.filter(
          (userEmail) => userEmail !== email.toString()
        );

        // Guardar los cambios en la base de datos
        await user.save();
        await apiCard.save();

        return res
          .status(202)
          .json({ mensaje: "Carta eliminada de favoritos exitosamente" });
      }

      // Agregar el ID de la carta al array de favoritos del usuario
      user.favApiCards.push(id);

      // Agregar el correo electrónico del usuario al array de favoritos de la carta
      apiCard.favoritedBy.push(email);

      // Guardar los cambios en la base de datos
      await user.save();
      await apiCard.save();

      res
        .status(200)
        .json({ mensaje: "Carta agregada a favoritos exitosamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        mensaje: "Error al agregar o eliminar la carta de favoritos",
        error,
      });
    }
  },
  async getFavoriteApiCards(req, res) {
    try {
      const { email } = req.params;
      const { page } = req.query;

      // Convertir la página a un número entero
      const parsedPage = parseInt(page, 10) || 1; // Página predeterminada

      // Número de tarjetas por página
      const cardsPerPage = 50;

      // Calcular el desplazamiento en función de la página y el número de tarjetas por página
      const offset = (parsedPage - 1) * cardsPerPage;

      // Buscar al usuario por su email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      // Obtener el número total de tarjetas favoritas del usuario
      const totalFavoriteApiCards = await ApiCards.countDocuments({
        favoritedBy: email,
      });

      // Calcular el número total de páginas
      const totalPages = Math.ceil(totalFavoriteApiCards / cardsPerPage);

      // Obtener las apiCards favoritas del usuario con el desplazamiento proporcionado
      const favoriteApiCards = await ApiCards.find({
        favoritedBy: email,
      })
        .skip(offset)
        .limit(cardsPerPage); // Limitar a la cantidad de tarjetas por página

      // Devolver la respuesta con las apiCards favoritas y el número total de páginas
      res.status(200).json({ favoriteApiCards, totalPages });
    } catch (error) {
      console.error("Error al obtener las apiCards favoritas:", error);
      res.status(500).json({
        mensaje:
          "Error interno del servidor al obtener las apiCards favoritas.",
        error,
      });
    }
  },
};

module.exports = apiCardsController;
