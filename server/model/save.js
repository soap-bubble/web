import { Schema } from 'mongoose';

const save = new Schema({
  playerId: String,
  saveId: String,
  timestamp: Date,
  gamestates: Schema.Types.Mixed,
  currentScene: Number,
  previousScene: Number,
  scenestate: Schema.Types.Mixed,
});

save.statics.findNewest = function findNewest(saveId) {
  return this.findOne({
    saveId,
  })
    .sort('-timestamp');
};

save.statics.findAllForPlayer = function findAllForPlayer(playerId) {
  return this.find({
    playerId,
  });
};

export default save;
