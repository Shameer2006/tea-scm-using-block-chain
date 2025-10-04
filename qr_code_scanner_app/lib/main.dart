import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const TeaScannerApp());
}

class TeaScannerApp extends StatelessWidget {
  const TeaScannerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tea Scanner',
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      home: const HomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}