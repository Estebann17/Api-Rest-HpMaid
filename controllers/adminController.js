const Report = require("../models/Report");
const User = require("../models/user");
const ApiCards = require("../models/apiCards");
const Card = require("../models/card");
const Ban = require("../models/ban");

const adminController = {
  async getAllReports(req, res) {
    try {
      // Buscar todos los reportes en la base de datos y llenar automáticamente los campos 'reportedUser' y 'reporter' con los nombres de usuario correspondientes
      const reports = await Report.find()
        .populate("reportedUser", "name")
        .populate("reporter", "name")
        .exec();

      // Si no se encontraron reportes, responder con un mensaje
      if (!reports || reports.length === 0) {
        return res.status(404).json({ message: "No se encontraron reportes." });
      }

      // Transformar los resultados para mostrar solo el nombre del usuario en 'reportedUser' y 'reporter'
      const transformedReports = reports.map((report) => ({
        ...report.toObject(),
        reportedUser: report.reportedUser
          ? report.reportedUser.name
          : "Usuario no encontrado",
        reporter: report.reporter
          ? report.reporter.name
          : "Usuario no encontrado",
      }));

      // Si se encontraron reportes, responder con los datos transformados
      res.status(200).json(transformedReports);
    } catch (error) {
      console.error("Error al obtener los reportes:", error);
      res
        .status(500)
        .json({ message: "Hubo un error al obtener los reportes." });
    }
  },
  async deleteReport(req, res) {
    try {
      const userEmail = req.body.email;
      const reportId = req.body.reportId;

      // Buscar al usuario por su email
      const user = await User.findOne({ email: userEmail });

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Verificar si el usuario tiene el rol adecuado (admin o mod)
      if (user.userRole !== "admin" && user.userRole !== "mod") {
        return res
          .status(403)
          .json({ message: "Error de autenticación: usuario no autorizado." });
      }

      // Eliminar el reporte con el ID proporcionado
      await Report.findByIdAndDelete(reportId);

      res.status(200).json({ message: "Reporte eliminado correctamente." });
    } catch (error) {
      console.error("Error al eliminar el reporte:", error);
      res
        .status(500)
        .json({ message: "Hubo un error al eliminar el reporte." });
    }
  },
  async changeRole(req, res) {
    try {
      const { userId, email, newRole } = req.body;

      // Buscar al usuario por su ID
      const userToChangeRole = await User.findById(userId);

      if (!userToChangeRole) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Buscar al usuario que solicita el cambio por su correo electrónico
      const userRequestingChange = await User.findOne({ email: email });

      if (!userRequestingChange) {
        return res
          .status(404)
          .json({ message: "Usuario que solicita el cambio no encontrado." });
      }

      // Verificar si el usuario que solicita el cambio tiene el rol adecuado (admin)
      if (userRequestingChange.userRole !== "admin") {
        return res
          .status(403)
          .json({
            message:
              "El usuario que solicita el cambio no tiene permisos suficientes.",
          });
      }

      // Acceder a la propiedad userRole
      userToChangeRole.userRole = newRole;
      await userToChangeRole.save();

      res.status(200).json({ message: "Rol cambiado correctamente." });
    } catch (error) {
      console.error("Error al cambiar el rol:", error);
      res.status(500).json({ message: "Hubo un error al cambiar el rol." });
    }
  },
  async temporalBan(req, res) {
    try {
      const { adminEmail, userEmail, banDate, reason } = req.body;

      // Buscar al usuario administrador por su email
      const adminUser = await User.findOne({ email: adminEmail });

      if (!adminUser) {
        return res
          .status(404)
          .json({ message: "Usuario administrador no encontrado." });
      }

      // Verificar si el usuario administrador tiene el rol adecuado (mod o admin)
      if (adminUser.userRole !== "admin" && adminUser.userRole !== "mod") {
        return res
          .status(403)
          .json({
            message: "El usuario administrador no tiene permisos suficientes.",
          });
      }

      // Buscar al usuario a banear por su email
      const userToBan = await User.findOne({ email: userEmail });

      if (!userToBan) {
        return res
          .status(404)
          .json({ message: "Usuario a banear no encontrado." });
      }

      // Verificar si el usuario ya tiene una petición de baneo activa
      const existingBan = await Ban.findOne({
        user: userToBan._id
      });

      if (existingBan) {
        return res
          .status(203)
          .json({ message: "El usuario ya tiene un baneo activo." });
      }

      // Convertir la fecha de desbaneo de string a tipo Date
      const banDateObj = new Date(banDate);

      // Crear una instancia de Ban con los datos proporcionados y guardarlo en la base de datos
      const ban = new Ban({
        user: userToBan._id,
        timeToReturn: banDateObj,
        responsable: adminUser._id,
        reason: reason,
      });

      await ban.save();

      res
        .status(200)
        .json({ message: "Usuario baneado temporalmente correctamente." });
    } catch (error) {
      console.error("Error al banear temporalmente al usuario:", error);
      res
        .status(500)
        .json({ message: "Hubo un error al banear temporalmente al usuario." });
    }
  },
  async unBan(req, res) {},
  
  async chekauth(req, res) {
    try {

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ userRole: user.userRole });
    } catch (error) {
        console.error('Error en la función chekauth:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = adminController;
