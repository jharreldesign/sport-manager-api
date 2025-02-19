// authorization.js
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
      return next();
  } else {
      return res.status(403).json({ error: 'You are not authorized to perform this action' });
  }
}

function authorizeTeamOwner(req, res, next) {
  // Example: Check if the user is the manager/owner of the team
  Team.findById(req.params.teamId)
      .then(team => {
          if (!team) {
              return res.status(404).json({ error: 'Team not found' });
          }

          if (team.manager.toString() !== req.user._id.toString()) {
              return res.status(403).json({ error: 'You are not the team owner' });
          }

          next();
      })
      .catch(err => {
          res.status(500).json({ error: err.message });
      });
}

module.exports = { isAdmin, authorizeTeamOwner };
