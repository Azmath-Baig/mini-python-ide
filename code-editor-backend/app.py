from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import io
import contextlib

app = Flask(__name__)
CORS(app)

@app.route("/ping", methods=["GET"])
def ping():
    return "Pong", 200

@app.route("/execute", methods=["POST"])
def execute_code():
    data = request.json
    code = data.get("code", "")
    user_input = data.get("input", "")

    # Prepare to capture stdout and stderr
    output_buffer = io.StringIO()
    error_buffer = io.StringIO()

    # Split input into multiple lines to handle multiple input() calls
    input_lines = user_input.strip().split("\n")
    input_iter = iter(input_lines)

    # Custom input function
    def custom_input(prompt=""):
        try:
            return next(input_iter)
        except StopIteration:
            raise Exception("Not enough input provided.")

    try:
        with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(error_buffer):
            exec_globals = {
                "input": custom_input,
                "__name__": "__main__"
            }
            exec(code, exec_globals)
    except Exception as e:
        error_buffer.write(str(e))

    stdout = output_buffer.getvalue()
    stderr = error_buffer.getvalue()

    return jsonify(stdout=stdout, stderr=stderr)

if __name__ == "__main__":
    app.run(debug=True)
