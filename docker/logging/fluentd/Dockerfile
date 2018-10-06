FROM fluent/fluentd:v0.12.42-debian
RUN ["gem", "install", "fluent-plugin-elasticsearch", "--no-rdoc", "--no-ri", "--version", "1.17.2"]
COPY fluent.conf /fluentd/etc/
