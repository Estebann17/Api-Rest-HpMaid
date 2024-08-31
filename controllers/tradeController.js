const Trade = require("../models/tradeRequest");
const User = require("../models/user");
const Card = require("../models/card");
const axios = require("axios");
const ApiCards = require("../models/apiCards");

async function getMonedasCard(mal_id) {
  try {
    // Verifica si mal_id es válido
    if (!mal_id) {
      throw new Error("mal_id no proporcionado");
    }

    // Buscar la carta en la base de datos por su mal_id
    const carta = await ApiCards.findOne({ mal_id });

    // Verificar si la carta existe
    if (!carta) {
      throw new Error("Carta no encontrada");
    }

    // Devolver el valor de .monedas de la carta
    const monedas = carta.monedas;

    return monedas;
  } catch (error) {
    console.error("Error en getMonedasCard:", error);
    throw new Error("Error al obtener las monedas para la carta");
  }
}

async function getRarezaCard(mal_id) {
  try {
    // Verifica si mal_id es válido
    if (!mal_id) {
      throw new Error("mal_id no proporcionado");
    }

    // Buscar la carta en la base de datos por su mal_id
    const carta = await ApiCards.findOne({ mal_id });

    // Verificar si la carta existe
    if (!carta) {
      throw new Error("Carta no encontrada");
    }

    // Devolver la rareza de la carta
    const rareza = carta.rareza || "comun"; // Si no hay rareza, se establece como "comun"

    return rareza;
  } catch (error) {
    console.error("Error en getRarezaCard:", error);
    throw new Error("Error al obtener la rareza para la carta");
  }
}

const tradeController = {
  async sendTradeRequest(req, res) {
    try {
      // Obtener el userId, email y las cartas ofrecidas del cuerpo de la solicitud
      const { userId, email, cardsOffered } = req.body;

      // Verificar si se proporcionaron los datos necesarios en el cuerpo de la solicitud
      if (!userId || !email || !cardsOffered) {
        return res.status(400).json({
          message: "Faltan datos por enviar",
        });
      }

      // Buscar al usuario que hace la solicitud en la base de datos por su correo electrónico
      const requester = await User.findOne({ email });
      if (!requester) {
        return res.status(404).json({
          message:
            "Usuario que hace la solicitud no encontrado con este correo electrónico",
        });
      }

      // Buscar al usuario objetivo en la base de datos por su userId
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          message: "Usuario objetivo no encontrado con este ID",
        });
      }

      // Crear un nuevo objeto TradeRequest y guardarlo en la base de datos como solicitud
      const newTrade = new Trade({
        requester: { userId: requester._id, email, cardsOffered },
        targetUser: { userId: targetUser._id, email: targetUser.email },
        status: "pending",
      });

      await newTrade.save();

      // Actualizar el usuario que hace la solicitud (agregar el ID de la transacción a la lista de trades)
      requester.trades.push(newTrade._id);
      await requester.save();

      res.status(200).json({
        message: "Solicitud de intercambio enviada exitosamente",
        trade: newTrade,
      });
    } catch (error) {
      console.error("Error enviando la solicitud de intercambio:", error);
      res.status(500).json({
        message: "Error enviando la solicitud de intercambio",
        error: error.message,
      });
    }
  },
  async getTradeRequests(req, res) {
    try {
      // Obtener el email del usuario de la solicitud
      const { email } = req.body;

      // Verificar si se proporcionó un email en el cuerpo de la solicitud
      if (!email) {
        return res.status(400).json({
          message:
            "El email del usuario es obligatorio en el cuerpo de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por su email
      const targetUser = await User.findOne({ email });
      if (!targetUser) {
        return res.status(404).json({
          message: "Usuario no encontrado con este email",
        });
      }

      // Buscar todas las solicitudes de intercambio donde el usuario es el targetUser
      const tradeRequests = await Trade.find({
        "targetUser.userId": targetUser._id,
        status: "pending",
      }).populate("requester.userId", "email name image banner"); // Populate para obtener detalles del solicitante

      res.status(200).json({
        message: "Solicitudes de intercambio obtenidas exitosamente",
        tradeRequests,
      });
    } catch (error) {
      console.error("Error obteniendo solicitudes de intercambio:", error);
      res.status(500).json({
        message: "Error obteniendo solicitudes de intercambio",
        error: error.message,
      });
    }
  },
  async viewTradeRequests(req, res) {
    try {
      // Obtener el email del usuario de la solicitud
      const { email } = req.body;

      // Verificar si se proporcionó un email en el cuerpo de la solicitud
      if (!email) {
        return res.status(400).json({
          message:
            "El email del usuario es obligatorio en el cuerpo de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por su email
      const targetUser = await User.findOne({ email });
      if (!targetUser) {
        return res.status(404).json({
          message: "Usuario no encontrado con este email",
        });
      }

      // Buscar todas las solicitudes de intercambio donde el usuario es el targetUser
      const tradeRequests = await Trade.find({
        "targetUser.userId": targetUser._id,
        status: "pending",
      })
        .populate("requester.userId", "email name") // Populate para obtener detalles del solicitante
        .populate("requester.cardsOffered", "title content"); // Populate para obtener detalles de las cartas ofrecidas

      res.status(200).json({
        message: "Solicitudes de intercambio obtenidas exitosamente",
        tradeRequests,
      });
    } catch (error) {
      console.error("Error obteniendo solicitudes de intercambio:", error);
      res.status(500).json({
        message: "Error obteniendo solicitudes de intercambio",
        error: error.message,
      });
    }
  },
  async viewTradeRequestsbyId(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message:
            "El ID de la solicitud de intercambio es obligatorio en la URL",
        });
      }

      const tradeRequest = await Trade.findById(id)
        .populate("requester.userId", "email name")
        .populate("requester.cardsOffered", "title content")
        .populate("targetUser.userId", "email name")
        .populate("targetUser.cardsOffered", "title content");

      if (!tradeRequest) {
        return res.status(404).json({
          message: "Solicitud de intercambio no encontrada con este ID",
        });
      }

      // Para cada carta ofrecida en la solicitud, obtén las monedas y actualiza el campo 'monedas'
      for (const cardOffered of tradeRequest.requester.cardsOffered) {
        const mal_id = cardOffered.content.mal_id;
        const monedas = await getMonedasCard(mal_id);
        const rareza = await getRarezaCard(mal_id);

        cardOffered.content.monedas = monedas;
        cardOffered.content.rareza = rareza;
      }

      // Para cada carta ofrecida por el targetUser, obtén las monedas y actualiza el campo 'monedas'
      for (const cardOffered of tradeRequest.targetUser.cardsOffered) {
        const mal_id = cardOffered.content.mal_id;
        const monedas = await getMonedasCard(mal_id);
        const rareza = await getRarezaCard(mal_id);

        cardOffered.content.monedas = monedas;
        cardOffered.content.rareza = rareza;
      }

      res.status(200).json({
        message: "Solicitud de intercambio obtenida exitosamente",
        tradeRequest,
      });
    } catch (error) {
      console.error("Error obteniendo solicitud de intercambio:", error);
      res.status(500).json({
        message: "Error obteniendo solicitud de intercambio",
        error: error.message,
      });
    }
  },
  async editTradeRequest(req, res) {
    try {
      const { id, addedCards } = req.body;

      // Verificar si se proporcionaron los datos necesarios en el cuerpo de la solicitud
      if (!id || !addedCards) {
        return res.status(400).json({
          message: "Faltan datos por enviar",
        });
      }

      // Buscar la solicitud de intercambio en la base de datos por su ID
      const tradeRequest = await Trade.findById(id);

      if (!tradeRequest) {
        return res.status(404).json({
          message: "Solicitud de intercambio no encontrada con este ID",
        });
      }

      // Agregar las nuevas cartas a las cartas ofrecidas en la solicitud de intercambio
      tradeRequest.targetUser = {
        ...tradeRequest.targetUser,
        cardsOffered: [...tradeRequest.targetUser.cardsOffered, ...addedCards],
      };

      tradeRequest.status = "ready";
      // Guardar la solicitud de intercambio actualizada en la base de datos
      await tradeRequest.save();

      res.status(200).json({
        message: "Solicitud de intercambio editada exitosamente",
        tradeRequest,
      });
    } catch (error) {
      console.error("Error editando la solicitud de intercambio:", error);
      res.status(500).json({
        message: "Error editando la solicitud de intercambio",
        error: error.message,
      });
    }
  },
  async getAwaitingRequests(req, res) {
    try {
      // Obtener el email del usuario de la solicitud
      const { email } = req.body;

      // Verificar si se proporcionó un email en el cuerpo de la solicitud
      if (!email) {
        return res.status(400).json({
          message:
            "El email del usuario es obligatorio en el cuerpo de la solicitud",
        });
      }

      // Buscar al usuario en la base de datos por su email
      const requester = await User.findOne({ email });
      if (!requester) {
        return res.status(404).json({
          message: "Usuario no encontrado con este email",
        });
      }

      // Buscar todas las solicitudes de intercambio donde el usuario es el requester y el status es 'ready'
      const awaitingRequests = await Trade.find({
        "requester.userId": requester._id,
        status: "ready",
      })
        .populate("requester.userId", "email name image banner") // Populate para obtener detalles del usuario objetivo
        .populate("targetUser.userId", "email name image banner cardsOffered"); // Populate para obtener detalles del targetUser, incluyendo las cartas ofrecidas

      res.status(200).json({
        message: "Solicitudes de intercambio pendientes obtenidas exitosamente",
        awaitingRequests,
      });
    } catch (error) {
      console.error(
        "Error obteniendo solicitudes de intercambio pendientes:",
        error
      );
      res.status(500).json({
        message: "Error obteniendo solicitudes de intercambio pendientes",
        error: error.message,
      });
    }
  },
  async acceptTradeRequest(req, res) {
    try {
      // Obtener el ID de la solicitud de intercambio y las cartas de la solicitud
      const { id, requesterCards, targetUserCards } = req.body;

      // Verificar si se proporcionaron los datos necesarios en el cuerpo de la solicitud
      if (!id || !requesterCards || !targetUserCards) {
        return res.status(400).json({
          message: "Faltan datos por enviar",
        });
      }

      // Buscar la solicitud de intercambio en la base de datos por su ID
      const tradeRequest = await Trade.findById(id);

      if (!tradeRequest) {
        return res.status(404).json({
          message: "Solicitud de intercambio no encontrada con este ID",
        });
      }

      // Obtener los IDs de las cartas ofrecidas por el solicitante y el targetUser
      const requesterCardIds = requesterCards.map((card) => card._id);
      const targetUserCardIds = targetUserCards.map((card) => card._id);

      // Intercambiar las cartas en la solicitud de intercambio
      tradeRequest.targetUser.cardsOffered = requesterCardIds;
      tradeRequest.requester.cardsOffered = targetUserCardIds;

      // Obtener los correos electrónicos de los usuarios
      const requesterUser = await User.findById(tradeRequest.requester.userId);
      const targetUser = await User.findById(tradeRequest.targetUser.userId);
      const requesterEmail = requesterUser.email;
      const targetUserEmail = targetUser.email;

      // Actualizar los correos electrónicos de los usuarios en la solicitud de intercambio
      tradeRequest.targetUser.email = requesterEmail;
      tradeRequest.requester.email = targetUserEmail;

      // Actualizar el estado de la solicitud de intercambio
      tradeRequest.status = "accepted";

      // Guardar la solicitud de intercambio actualizada en la base de datos
      await tradeRequest.save();

      // Actualizar los correos electrónicos en las cartas
      await Card.updateMany(
        { _id: { $in: [...requesterCardIds, ...targetUserCardIds] } },
        { $set: { "user.email": targetUserEmail } }
      );

      // Actualizar las cartas obtenidas tanto para el targetUser como para el requesterUser
      const allCardIds = [...requesterCardIds, ...targetUserCardIds];
      const allCards = await Card.find({ _id: { $in: allCardIds } });

      allCards.forEach((card) => {
        if (requesterCardIds.includes(card._id.toString())) {
          card.user.email = targetUserEmail;
        } else {
          card.user.email = requesterEmail;
        }
      });

      await Promise.all(allCards.map((card) => card.save()));

      // Eliminar las cartas antiguas del solicitante y agregar las nuevas
      requesterUser.cards = requesterUser.cards.filter(
        (cardId) => !requesterCardIds.includes(cardId.toString())
      );
      requesterUser.cards.push(...targetUserCardIds);
      await requesterUser.save();

      // Eliminar las cartas antiguas del targetUser y agregar las nuevas
      targetUser.cards = targetUser.cards.filter(
        (cardId) => !targetUserCardIds.includes(cardId.toString())
      );
      targetUser.cards.push(...requesterCardIds);
      await targetUser.save();

      res.status(200).json({
        message: "Solicitud de intercambio aceptada exitosamente",
        tradeRequest,
      });
    } catch (error) {
      console.error("Error aceptando la solicitud de intercambio:", error);
      res.status(500).json({
        message: "Error aceptando la solicitud de intercambio",
        error: error.message,
      });
    }
  },
  async deleteTrade(req, res) {
    try {
      const { id } = req.params; // Obtener el ID de la publicación de los parámetros de la solicitud

      // Verificar si se proporcionó un ID de publicación en los parámetros de la solicitud
      if (!id) {
        return res.status(400).json({
          message:
            "El ID de la publicación es obligatorio en los parámetros de la solicitud",
        });
      }

      // Buscar la publicación en la base de datos por ID de publicación
      const trade = await Trade.findById(id);

      if (!trade) {
        return res
          .status(404)
          .json({ message: "Publicación no encontrada con este ID" });
      }

      // Eliminar la publicación de la base de datos
      await Trade.findByIdAndDelete(id);

      res
        .status(200)
        .json({ message: "Publicación eliminada exitosamente", trade });
    } catch (error) {
      console.error("Error eliminando la publicación:", error);
      res.status(500).json({
        message: "Error eliminando la publicación",
        error: error.message,
      });
    }
  },
};

module.exports = tradeController;
